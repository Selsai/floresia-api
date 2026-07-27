import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.article.findMany({
      include: {
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        comments: true,
      },
    });
  }

  create(userId: string, dto: CreateArticleDto) {
    return this.prisma.article.create({
      data: {
        ...dto,

        author: {
          connect: {
            id: userId,
          },
        },
      },

      include: {
        author: true,
      },
    });
  }

  async update(id: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article introuvable');
    }

    return this.prisma.article.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article introuvable');
    }

    await this.prisma.article.delete({
      where: { id },
    });

    return {
      message: 'Article supprimé avec succès.',
    };
  }
}