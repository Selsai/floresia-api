import { NotFoundException } from '@nestjs/common';
import { FlowersService } from './flowers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowerDto } from './dto/create-flower.dto';
describe('FlowersService : catalogue et erreurs', () => {
  const model = { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() };
  let service: FlowersService;
  beforeEach(() => { jest.resetAllMocks(); service = new FlowersService({ flower: model } as unknown as PrismaService); model.findUnique.mockResolvedValue({ id: 'p' }); });
  it('liste le catalogue du plus récent au plus ancien', async () => {
    model.findMany.mockResolvedValue([{ id: 'p' }]); expect(await service.findAll()).toEqual([{ id: 'p' }]);
    expect(model.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });
  it('cherche le produit demandé et conserve une absence', async () => {
    model.findUnique.mockResolvedValue(null); expect(await service.findOne('missing')).toBeNull();
    expect(model.findUnique).toHaveBeenCalledWith({ where: { id: 'missing' } });
  });
  it('conserve les données validées du catalogue lors de la création', async () => {
    const dto = { name: 'Test', price: 3.5 } as CreateFlowerDto; await service.create(dto);
    expect(model.create).toHaveBeenCalledWith({ data: dto });
  });
  it.each(['update', 'remove'] as const)('refuse %s pour un identifiant inconnu', async (method) => {
    model.findUnique.mockResolvedValue(null);
    const result = method === 'update' ? service.update('missing', { price: 2 }) : service.remove('missing');
    await expect(result).rejects.toBeInstanceOf(NotFoundException);
    expect(model.update).not.toHaveBeenCalled(); expect(model.delete).not.toHaveBeenCalled();
  });
  it('met à jour uniquement le produit demandé', async () => {
    await service.update('p', { price: 2 }); expect(model.update).toHaveBeenCalledWith({ where: { id: 'p' }, data: { price: 2 } });
  });
  it('supprime uniquement le produit demandé', async () => {
    await service.remove('p'); expect(model.delete).toHaveBeenCalledWith({ where: { id: 'p' } });
  });
});