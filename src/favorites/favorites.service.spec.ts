import { NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';
describe('FavoritesService : favoris privés et doublons', () => {
  const prisma = { product: { findUnique: jest.fn() }, favorite: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() } };
  let service: FavoritesService;
  beforeEach(() => { jest.resetAllMocks(); service = new FavoritesService(prisma as unknown as PrismaService); prisma.product.findUnique.mockResolvedValue({ id: 'p' }); });
  it('limite les favoris au propriétaire', async () => {
    await service.findAll('u'); expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u' }, include: { product: true } }));
  });
  it('refuse un produit absent', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.add('u', 'p')).rejects.toBeInstanceOf(NotFoundException); expect(prisma.favorite.create).not.toHaveBeenCalled();
  });
  it('ne crée pas deux fois un favori existant', async () => {
    const existing = { id: 'f' }; prisma.favorite.findUnique.mockResolvedValue(existing);
    expect(await service.add('u', 'p')).toEqual(existing); expect(prisma.favorite.create).not.toHaveBeenCalled();
  });
  it('crée un favori associé au compte et au produit', async () => {
    await service.add('u', 'p'); expect(prisma.favorite.create).toHaveBeenCalledWith({ data: { userId: 'u', productId: 'p' }, include: { product: true } });
  });
  it('refuse de supprimer un favori absent pour ce compte', async () => {
    await expect(service.remove('u', 'p')).rejects.toBeInstanceOf(NotFoundException); expect(prisma.favorite.delete).not.toHaveBeenCalled();
  });
  it('supprime uniquement le favori trouvé pour le compte et le produit', async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: 'f' }); await service.remove('u', 'p');
    expect(prisma.favorite.findUnique).toHaveBeenCalledWith({ where: { userId_productId: { userId: 'u', productId: 'p' } } });
    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 'f' } });
  });
});