import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Panier partagé entre appareils', () => {
  let service: CartService;
  let state: {
    cart: unknown[];
    cartVersion: number;
    cartOperationIds: string[];
    deletionRequestedAt: Date | null;
    accountErasedAt: Date | null;
  };
  const user = { findUnique: jest.fn(), updateMany: jest.fn() };
  const product = { findUnique: jest.fn() };
  const flower = { findMany: jest.fn() };
  const add = (commandId: string, id = 'p') => ({
    commandId,
    operation: 'add',
    quantity: 1,
    item: { id, price: 0.01 },
  });
  beforeEach(() => {
    jest.resetAllMocks();
    state = {
      cart: [],
      cartVersion: 0,
      cartOperationIds: [],
      deletionRequestedAt: null,
      accountErasedAt: null,
    };
    user.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) =>
        where.id === 'u' ? structuredClone(state) : null,
    );
    user.updateMany.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: { cartVersion: number };
        data: { cart: unknown[]; cartOperationIds: string[] };
      }) => {
        if (where.cartVersion !== state.cartVersion) return { count: 0 };
        state = {
          ...state,
          cart: data.cart,
          cartOperationIds: data.cartOperationIds,
          cartVersion: state.cartVersion + 1,
        };
        return { count: 1 };
      },
    );
    product.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        name: 'Bouquet',
        price: 40,
        imageUrl: '/bouquet.png',
        category: 'CLASSIC',
      }),
    );
    service = new CartService({
      user,
      product,
      flower,
    } as unknown as PrismaService);
  });
  it('retrouve les mêmes articles sur une nouvelle lecture et ignore le prix fourni', async () => {
    await service.mutate('u', add('a'));
    expect(await service.get('u')).toEqual({
      version: 1,
      items: [expect.objectContaining({ id: 'p', price: 40, quantity: 1 })],
    });
  });
  it('ne double pas un ajout réessayé après une réponse réseau perdue', async () => {
    await service.mutate('u', add('a'));
    await service.mutate('u', add('a'));
    expect((await service.get('u')).items).toEqual([
      expect.objectContaining({ quantity: 1 }),
    ]);
  });
  it('conserve deux ajouts simultanés provenant de deux appareils', async () => {
    await Promise.all([
      service.mutate('u', add('a', 'p')),
      service.mutate('u', add('b', 'q')),
    ]);
    expect((await service.get('u')).items).toHaveLength(2);
    expect(state.cartVersion).toBe(2);
  });
  it('fusionne une copie locale sans doubler un article déjà synchronisé', async () => {
    await service.mutate('u', add('a'));
    await service.mutate('u', {
      commandId: 'b',
      operation: 'merge',
      items: [{ id: 'p', quantity: 1 }],
    });
    expect((await service.get('u')).items).toEqual([
      expect.objectContaining({ quantity: 1 }),
    ]);
  });
  it('retire uniquement les quantités achetées', async () => {
    await service.mutate('u', { ...add('a'), quantity: 3 });
    await service.mutate('u', add('b', 'q'));
    await service.mutate('u', {
      commandId: 'c',
      operation: 'settle',
      items: [{ id: 'p', quantity: 2 }],
    });
    expect((await service.get('u')).items).toEqual([
      expect.objectContaining({ id: 'p', quantity: 1 }),
      expect.objectContaining({ id: 'q', quantity: 1 }),
    ]);
  });
  it('refuse un compte différent ou désactivé', async () => {
    await expect(service.get('other')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    state.deletionRequestedAt = new Date();
    await expect(service.mutate('u', add('a'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(user.updateMany).not.toHaveBeenCalled();
  });
  it('refuse une modification sans identifiant et une quantité fractionnaire', async () => {
    await expect(
      service.mutate('u', { commandId: 'a', operation: 'remove' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.mutate('u', { ...add('b'), quantity: 1.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
