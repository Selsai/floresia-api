import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCommentDto } from './dto/create-comment.dto';

const AUTHOR_SELECT = { id: true, firstName: true, lastName: true };

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  findByArticle(articleId: string) {
    return this.prisma.comment.findMany({
      where: { articleId, parentId: null },
      include: {
        author: { select: AUTHOR_SELECT },
        taggedUser: { select: AUTHOR_SELECT },
        replies: {
          include: {
            author: { select: AUTHOR_SELECT },
            taggedUser: { select: AUTHOR_SELECT },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Pour l'autocomplete du @ : uniquement les gens ayant déjà commenté l'article
  async getCommentersForArticle(articleId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { articleId },
      select: { author: { select: AUTHOR_SELECT } },
      distinct: ['authorId'],
    });

    return comments.map((c) => c.author);
  }

  findAllForAdmin() {
    return this.prisma.comment.findMany({
      include: {
        author: { select: AUTHOR_SELECT },
        article: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(authorId: string, dto: CreateCommentDto, imageUrl?: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!author?.isEmailVerified) {
      throw new ForbiddenException(
        'Veuillez vérifier votre adresse email avant de pouvoir commenter.',
      );
    }

    const article = await this.prisma.article.findUnique({
      where: { id: dto.articleId },
    });

    if (!article) {
      throw new NotFoundException('Article introuvable.');
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (parent && parent.articleId !== dto.articleId) {
        throw new ForbiddenException('Le commentaire parent appartient à un autre article.');
      }
      if (!parent) {
        throw new NotFoundException('Commentaire parent introuvable.');
      }
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId,
        parentId: dto.parentId,
        taggedUserId: dto.taggedUserId,
        imageUrl,
      },
      include: {
        author: { select: AUTHOR_SELECT },
        taggedUser: { select: AUTHOR_SELECT },
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable.');
    }

    if (role !== 'ADMIN' && comment.authorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres commentaires.',
      );
    }

    await this.prisma.comment.delete({ where: { id } });

    return { message: 'Commentaire supprimé avec succès.' };
  }
}
