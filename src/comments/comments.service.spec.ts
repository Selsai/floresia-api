import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
describe('CommentsService : participation et suppression', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    article: { findUnique: jest.fn() },
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: CommentsService;
  const dto = { articleId: 'a', content: 'Merci pour ces conseils' };
  beforeEach(() => {
    jest.resetAllMocks();
    service = new CommentsService(prisma as unknown as PrismaService);
    prisma.user.findUnique.mockResolvedValue({ isEmailVerified: true });
    prisma.article.findUnique.mockResolvedValue({ id: 'a' });
    prisma.comment.findUnique.mockResolvedValue({
      id: 'c',
      authorId: 'u',
      articleId: 'a',
    });
  });
  it('charge les commentaires racines avec leurs réponses sans données privées', async () => {
    await service.findByArticle('a');
    const query = prisma.comment.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ articleId: 'a', parentId: null });
    expect(query.include.author.select).toEqual({
      id: true,
      firstName: true,
      lastName: true,
    });
    expect(query.include.replies.orderBy).toEqual({ createdAt: 'asc' });
  });
  it('retourne les auteurs distincts pour les mentions', async () => {
    prisma.comment.findMany.mockResolvedValue([{ author: { id: 'u' } }]);
    expect(await service.getCommentersForArticle('a')).toEqual([{ id: 'u' }]);
    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ['authorId'],
        where: { articleId: 'a' },
      }),
    );
  });
  it('charge la liste de modération avec le titre de l’article', async () => {
    await service.findAllForAdmin();
    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          article: { select: { id: true, title: true } },
        }),
      }),
    );
  });
  it.each([null, { isEmailVerified: false }])(
    'refuse de commenter sans compte vérifié (%p)',
    async (user) => {
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.create('u', dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    },
  );
  it('refuse un article absent', async () => {
    prisma.article.findUnique.mockResolvedValue(null);
    await expect(service.create('u', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('refuse une réponse à un commentaire absent', async () => {
    prisma.comment.findUnique.mockResolvedValue(null);
    await expect(
      service.create('u', { ...dto, parentId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('associe le commentaire au compte connecté', async () => {
    await service.create('u', dto);
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ...dto, authorId: 'u' }),
      }),
    );
  });
  it('associe une réponse, une mention et une image aux identifiants validés', async () => {
    await service.create(
      'u',
      { ...dto, parentId: 'c', taggedUserId: 'v' },
      '/uploads/test.png',
    );
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          ...dto,
          authorId: 'u',
          parentId: 'c',
          taggedUserId: 'v',
          imageUrl: '/uploads/test.png',
        },
      }),
    );
  });
  it('refuse une réponse liée à un autre article', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 'c',
      articleId: 'other',
    });
    await expect(
      service.create('u', { ...dto, parentId: 'c' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
  it('refuse de supprimer un commentaire absent', async () => {
    prisma.comment.findUnique.mockResolvedValue(null);
    await expect(service.remove('c', 'u', 'USER')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('refuse de supprimer le commentaire d’un autre compte', async () => {
    await expect(service.remove('c', 'v', 'USER')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.comment.delete).not.toHaveBeenCalled();
  });
  it.each([
    ['u', 'USER'],
    ['admin', 'ADMIN'],
  ])(
    'autorise son propre commentaire ou la modération (%s)',
    async (id, role) => {
      await service.remove('c', id, role);
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'c' },
      });
    },
  );
});
