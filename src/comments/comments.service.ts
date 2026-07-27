import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,

        article: {
          connect: {
            id: dto.articleId,
          },
        },

        author: {
          connect: {
            id: userId,
          },
        },
      },

      include: {
        author: true,
        article: true,
      },
    });
  }

  findByArticle(articleId: string) {
    return this.prisma.comment.findMany({
      where: {
        articleId,
      },

      include: {
        author: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  findOne(id: string) {
  return this.prisma.comment.findUnique({
    where: {
      id,
    },

    include: {
      author: true,
      article: true,
    },
  });
}
  async update(id: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    return this.prisma.comment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return {
      message: 'Commentaire supprimé avec succès.',
    };
  }
}