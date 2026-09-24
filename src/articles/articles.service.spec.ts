import { NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';
describe('ArticlesService : articles et auteur', () => {
  const article = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
  let service: ArticlesService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new ArticlesService({ article } as unknown as PrismaService);
    article.findUnique.mockResolvedValue({ id: 'a' });
  });
  it('liste les articles récents', async () => {
    await service.findAll();
    expect(article.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
  it('retrouve un article', async () => {
    expect(await service.findOne('a')).toEqual({ id: 'a' });
  });
  it.each(['findOne', 'remove'] as const)(
    'refuse %s d’un article absent',
    async (method) => {
      article.findUnique.mockResolvedValue(null);
      await expect(service[method]('a')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(article.delete).not.toHaveBeenCalled();
    },
  );
  it('associe un nouvel article à son auteur', async () => {
    const dto = {
      title: 'Roses',
      content: 'Conseils',
      imageUrl: '/image.png',
      excerpt: 'Conseils',
      category: 'Conseils',
      readTime: '5 min',
      displayAuthorName: 'Flora',
    };
    await service.create('u', dto);
    expect(article.create).toHaveBeenCalledWith({
      data: { ...dto, authorId: 'u' },
    });
  });
  it('supprime l’article existant demandé', async () => {
    await service.remove('a');
    expect(article.delete).toHaveBeenCalledWith({ where: { id: 'a' } });
  });
});
