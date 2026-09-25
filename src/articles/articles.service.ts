// Rôle : Règles métier et accès aux données.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    return article;
  }

  create(authorId: string, dto: CreateArticleDto) {
    return this.prisma.article.create({ data: { ...dto, authorId } });
  }

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    await this.prisma.article.delete({ where: { id } });
    return { message: 'Article supprimé avec succès.' };
  }
}
