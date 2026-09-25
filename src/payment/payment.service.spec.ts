// Rôle : Tests automatisés de cette fonctionnalité.
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './payment.service';

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
    checkout: {
      sessions: {
        create: jest
          .fn()
          .mockResolvedValue({ url: 'https://checkout.example.test' }),
      },
    },
  })),
);

describe('PaymentService : autorisation du paiement', () => {
  const findUnique = jest.fn();
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  let service: PaymentService;
  const order = {
    id: 'commande-1',
    userId: 'client-1',
    status: 'PENDING',
    totalAmount: 7,
    items: [{ quantity: 2, unitPrice: 3.5, product: { name: 'Rose' } }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue(order);
    service = new PaymentService(
      { get: () => 'https://example.test' } as unknown as ConfigService,
      { order: { findUnique, updateMany } } as unknown as PrismaService,
    );
  });

  function stripeCreate() {
    return (Stripe as unknown as jest.Mock).mock.results[0].value.checkout
      .sessions.create;
  }

  it('refuse une commande inexistante sans appeler Stripe', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.createCheckoutSession('absente', 'client-1'),
    ).rejects.toThrow(NotFoundException);
    expect(stripeCreate()).not.toHaveBeenCalled();
  });

  it('refuse la commande appartenant à un autre utilisateur', async () => {
    await expect(
      service.createCheckoutSession(order.id, 'client-2'),
    ).rejects.toThrow(ForbiddenException);
    expect(stripeCreate()).not.toHaveBeenCalled();
  });

  it('refuse une commande déjà payée', async () => {
    findUnique.mockResolvedValue({ ...order, status: 'PAID' });
    await expect(
      service.createCheckoutSession(order.id, 'client-1'),
    ).rejects.toThrow(BadRequestException);
    expect(stripeCreate()).not.toHaveBeenCalled();
  });

  it('autorise le propriétaire et transmet le prix en centimes', async () => {
    await expect(
      service.createCheckoutSession(order.id, 'client-1'),
    ).resolves.toEqual({
      checkoutUrl: 'https://checkout.example.test',
    });
    expect(stripeCreate()).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({ unit_amount: 350 }),
          }),
        ],
      }),
    );
  });

  it('ajoute les 5,90 € de livraison aux lignes Stripe', async () => {
    findUnique.mockResolvedValue({ ...order, totalAmount: 12.9 });
    await service.createCheckoutSession(order.id, 'client-1');
    expect(stripeCreate().mock.calls[0][0].line_items).toHaveLength(2);
    expect(stripeCreate().mock.calls[0][0].line_items[1]).toEqual({
      quantity: 1,
      price_data: {
        currency: 'eur',
        product_data: { name: 'Livraison' },
        unit_amount: 590,
      },
    });
  });

  it('refuse un total incompatible avec les lignes de commande', async () => {
    findUnique.mockResolvedValue({ ...order, totalAmount: 0.01 });
    await expect(
      service.createCheckoutSession(order.id, 'client-1'),
    ).rejects.toThrow(BadRequestException);
    expect(stripeCreate()).not.toHaveBeenCalled();
  });

  function webhook(payment_status = 'paid', amount_total = 700) {
    const stripe = (Stripe as unknown as jest.Mock).mock.results[0].value;
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { orderId: order.id },
          currency: 'eur',
          amount_total,
          payment_status,
        },
      },
    });
    return stripe;
  }

  it('ne confirme pas une session Stripe impayée', async () => {
    webhook('unpaid');
    await service.handleWebhookEvent(Buffer.from('{}'), 'signature');
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('refuse un paiement dont le montant ne correspond pas', async () => {
    webhook('paid', 1);
    await expect(
      service.handleWebhookEvent(Buffer.from('{}'), 'signature'),
    ).rejects.toThrow(BadRequestException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('confirme uniquement une commande PENDING avec un montant payé exact', async () => {
    webhook();
    await service.handleWebhookEvent(Buffer.from('{}'), 'signature');
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'PAID' },
    });
  });

  it('laisse la vérification de signature rejeter un événement invalide', async () => {
    const stripe = webhook();
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Signature invalide');
    });
    await expect(
      service.handleWebhookEvent(Buffer.from('{}'), 'invalide'),
    ).rejects.toThrow('Signature invalide');
    expect(updateMany).not.toHaveBeenCalled();
  });
});
