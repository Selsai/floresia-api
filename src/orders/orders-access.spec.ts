import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
describe('OrdersService : consultation et administration', () => {
  const order = { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() };
  let service: OrdersService;
  beforeEach(() => { jest.resetAllMocks(); service = new OrdersService({ order } as unknown as PrismaService); order.findUnique.mockResolvedValue({ id: 'o', userId: 'u' }); });
  it.each([['USER', { userId: 'u' }], ['ADMIN', {}]])('filtre la liste pour le rôle %s', async (role, where) => {
    await service.findAll('u', role as string);
    const query = order.findMany.mock.calls[0][0]; expect(query.where).toEqual(where);
    expect(query.include.user.select).not.toHaveProperty('passwordHash'); expect(query.include.user.select).not.toHaveProperty('resetToken');
  });
  it('refuse une commande absente', async () => { order.findUnique.mockResolvedValue(null); await expect(service.findOne('o', 'u', 'USER')).rejects.toBeInstanceOf(NotFoundException); });
  it('refuse une commande appartenant à un autre compte', async () => { await expect(service.findOne('o', 'other', 'USER')).rejects.toBeInstanceOf(ForbiddenException); });
  it.each([['u', 'USER'], ['admin', 'ADMIN']])('autorise le propriétaire ou l’administrateur (%s)', async (id, role) => { expect(await service.findOne('o', id, role)).toEqual({ id: 'o', userId: 'u' }); });
  it.each(['update', 'remove'] as const)('refuse %s d’une commande absente', async (method) => {
    order.findUnique.mockResolvedValue(null); const result = method === 'update' ? service.update('o', { status: 'SHIPPED' }) : service.remove('o');
    await expect(result).rejects.toBeInstanceOf(NotFoundException); expect(order.update).not.toHaveBeenCalled(); expect(order.delete).not.toHaveBeenCalled();
  });
  it('modifie le statut demandé', async () => { await service.update('o', { status: 'SHIPPED' }); expect(order.update).toHaveBeenCalledWith({ where: { id: 'o' }, data: { status: 'SHIPPED' } }); });
  it('supprime la commande demandée', async () => { await service.remove('o'); expect(order.delete).toHaveBeenCalledWith({ where: { id: 'o' } }); });
});