// Rôle : Tests automatisés de cette fonctionnalité.
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CUSTOM_BOUQUET_PRODUCT_ID } from '../chatbot/catalog-replies';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

describe('OrdersService : montants et composition', () => {
  const prisma = {
    address: { findUnique: jest.fn() },
    product: { findMany: jest.fn() },
    flower: { findMany: jest.fn() },
    order: { create: jest.fn() },
  };
  let service: OrdersService;
  const rose = {
    id: 'rose',
    name: 'Rose',
    color: 'Rose',
    price: 3.5,
    stock: 100,
    isSecondary: false,
  };
  const eucalyptus = {
    id: 'eucalyptus',
    name: 'Eucalyptus',
    color: 'Vert',
    price: 2,
    stock: 100,
    isSecondary: true,
  };
  const base: CreateOrderDto = {
    addressId: 'adresse-1',
    deliveryMethod: 'DELIVERY',
    totalAmount: 0.01,
    items: [{ productId: 'bouquet-1', quantity: 1, unitPrice: 0.01 }],
  };
  const custom = (
    flowers = [
      { flowerId: 'rose', quantity: 3 },
      { flowerId: 'eucalyptus', quantity: 1 },
    ],
  ): CreateOrderDto => ({
    ...base,
    items: [
      {
        productId: CUSTOM_BOUQUET_PRODUCT_ID,
        quantity: 1,
        unitPrice: 0.01,
        customBouquet: { flowers, occasionName: 'Mariage' },
      },
    ],
  });

  beforeEach(() => {
    Object.values(prisma).forEach((model) =>
      Object.values(model).forEach((mock) => mock.mockReset()),
    );
    prisma.address.findUnique.mockResolvedValue({
      id: 'adresse-1',
      userId: 'client-1',
    });
    prisma.product.findMany.mockResolvedValue([
      { id: 'bouquet-1', price: 32 },
      { id: CUSTOM_BOUQUET_PRODUCT_ID, price: 0 },
    ]);
    prisma.flower.findMany.mockResolvedValue([rose, eucalyptus]);
    prisma.order.create.mockImplementation(async (input) => input.data);
    service = new OrdersService(prisma as unknown as PrismaService);
  });

  it('ignore les prix falsifiés et calcule 32 € + 5,90 €', async () => {
    const result = await service.create('client-1', base);
    expect(result.totalAmount).toBe(37.9);
    expect(
      prisma.order.create.mock.calls[0][0].data.items.create[0].unitPrice,
    ).toBe(32);
  });

  it('offre la livraison à partir de 50 €', async () => {
    const result = await service.create('client-1', {
      ...base,
      items: [{ ...base.items[0], quantity: 2 }],
    });
    expect(result.totalAmount).toBe(64);
  });

  it('ne facture pas de livraison pour un retrait', async () => {
    const result = await service.create('client-1', {
      ...base,
      deliveryMethod: 'PICKUP',
      pickupStoreId: 'magasin',
    });
    expect(result.totalAmount).toBe(32);
  });

  it('refuse une adresse appartenant à un autre client', async () => {
    prisma.address.findUnique.mockResolvedValue({
      id: 'adresse-1',
      userId: 'client-2',
    });
    await expect(service.create('client-1', base)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('refuse une adresse inexistante', async () => {
    prisma.address.findUnique.mockResolvedValue(null);
    await expect(service.create('client-1', base)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refuse un retrait sans magasin', async () => {
    await expect(
      service.create('client-1', { ...base, deliveryMethod: 'PICKUP' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calcule les roses et le feuillage à la tige : 12,50 € + 5,90 €', async () => {
    const result = await service.create('client-1', custom());
    expect(result.totalAmount).toBe(18.4);
    const item = prisma.order.create.mock.calls[0][0].data.items.create[0];
    expect(item.unitPrice).toBe(12.5);
    expect(item.customNote).toContain('1x Eucalyptus Vert');
  });

  it('refuse une composition sans informations de fleurs', async () => {
    await expect(
      service.create('client-1', {
        ...base,
        items: [{ productId: CUSTOM_BOUQUET_PRODUCT_ID, quantity: 1 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuse une fleur inconnue', async () => {
    await expect(
      service.create(
        'client-1',
        custom([{ flowerId: 'inconnue', quantity: 1 }]),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuse une composition constituée uniquement de feuillage', async () => {
    await expect(
      service.create(
        'client-1',
        custom([{ flowerId: 'eucalyptus', quantity: 1 }]),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('cumule les doublons pour contrôler le stock', async () => {
    prisma.flower.findMany.mockResolvedValue([{ ...rose, stock: 5 }]);
    await expect(
      service.create(
        'client-1',
        custom([
          { flowerId: 'rose', quantity: 3 },
          { flowerId: 'rose', quantity: 3 },
        ]),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('cumule le stock de plusieurs bouquets personnalisés', async () => {
    prisma.flower.findMany.mockResolvedValue([{ ...rose, stock: 5 }]);
    const dto = custom([{ flowerId: 'rose', quantity: 3 }]);
    dto.items[0].quantity = 2;
    await expect(service.create('client-1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuse un panier vide', async () => {
    await expect(
      service.create('client-1', { ...base, items: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('valide les quantités entières et strictement positives du DTO', async () => {
    for (const quantity of [0, -1, 1.5]) {
      const dto = plainToInstance(CreateOrderDto, {
        ...base,
        items: [{ productId: 'bouquet-1', quantity }],
      });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    }
  });
});
