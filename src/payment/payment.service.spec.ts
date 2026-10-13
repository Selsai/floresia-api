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
import { MailService } from '../mail/mail.service';

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_1',
          url: 'https://checkout.example.test',
        }),
        retrieve: jest.fn(),
        list: jest.fn(),
      },
    },
  })),
);

describe('PaymentService : autorisation du paiement', () => {
  const findUnique = jest.fn();
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  const sendOrderConfirmation = jest.fn().mockResolvedValue(undefined);
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
      { sendOrderConfirmation } as unknown as MailService,
    );
  });

  function stripeCreate() {
    return (Stripe as unknown as jest.Mock).mock.results[0].value.checkout
      .sessions.create;
  }

  it('protège le document Stripe contre la consultation par un autre client', async () => {
    findUnique.mockResolvedValue({
      ...order,
      status: 'PAID',
      stripeCheckoutSessionId: 'cs_test_1',
    });
    await expect(
      service.getOrderDocument(order.id, 'client-2'),
    ).rejects.toThrow(ForbiddenException);
    expect(
      (Stripe as unknown as jest.Mock).mock.results[0].value.checkout.sessions
        .retrieve,
    ).not.toHaveBeenCalled();
  });

  it('refuse le document avant confirmation du paiement', async () => {
    await expect(
      service.getOrderDocument(order.id, 'client-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('renvoie la facture de la session payée correspondant à la commande', async () => {
    findUnique.mockResolvedValue({
      ...order,
      status: 'PAID',
      stripeCheckoutSessionId: 'cs_test_1',
    });
    (
      Stripe as unknown as jest.Mock
    ).mock.results[0].value.checkout.sessions.retrieve.mockResolvedValue({
      metadata: { orderId: order.id },
      payment_status: 'paid',
      currency: 'eur',
      amount_total: 700,
      invoice: { hosted_invoice_url: 'https://invoice.stripe.com/test' },
    });
    await expect(
      service.getOrderDocument(order.id, 'client-1'),
    ).resolves.toEqual({
      type: 'invoice',
      url: 'https://invoice.stripe.com/test',
    });
  });

  it('refuse une session dont le montant ne correspond pas', async () => {
    findUnique.mockResolvedValue({
      ...order,
      status: 'PAID',
      stripeCheckoutSessionId: 'cs_test_1',
    });
    (
      Stripe as unknown as jest.Mock
    ).mock.results[0].value.checkout.sessions.retrieve.mockResolvedValue({
      metadata: { orderId: order.id },
      payment_status: 'paid',
      currency: 'eur',
      amount_total: 701,
    });
    await expect(
      service.getOrderDocument(order.id, 'client-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('propose le reçu Stripe si aucune facture n’existe', async () => {
    findUnique.mockResolvedValue({
      ...order,
      status: 'PAID',
      stripeCheckoutSessionId: 'cs_test_1',
    });
    (
      Stripe as unknown as jest.Mock
    ).mock.results[0].value.checkout.sessions.retrieve.mockResolvedValue({
      metadata: { orderId: order.id },
      payment_status: 'paid',
      currency: 'eur',
      amount_total: 700,
      invoice: null,
      payment_intent: {
        latest_charge: { receipt_url: 'https://pay.stripe.com/receipts/test' },
      },
    });
    await expect(
      service.getOrderDocument(order.id, 'client-1'),
    ).resolves.toEqual({
      type: 'receipt',
      url: 'https://pay.stripe.com/receipts/test',
    });
  });

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

  it('envoie la confirmation après le passage à PAID et mémorise l’envoi', async () => {
    webhook();
    const paid = { ...order, status: 'PAID', confirmationEmailSentAt: null };
    findUnique.mockResolvedValueOnce(order).mockResolvedValueOnce(paid);
    await service.handleWebhookEvent(Buffer.from('{}'), 'signature');
    expect(sendOrderConfirmation).toHaveBeenCalledWith(paid);
    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: order.id, confirmationEmailSentAt: null },
      data: { confirmationEmailSentAt: expect.any(Date) },
    });
  });
  it('ne renvoie pas un email déjà enregistré pour un webhook répété', async () => {
    webhook();
    findUnique.mockResolvedValue({
      ...order,
      status: 'PAID',
      confirmationEmailSentAt: new Date(),
    });
    await service.handleWebhookEvent(Buffer.from('{}'), 'signature');
    expect(sendOrderConfirmation).not.toHaveBeenCalled();
  });
  it('permet à Stripe de réessayer l’email sans perdre le paiement confirmé', async () => {
    webhook();
    findUnique.mockResolvedValueOnce(order).mockResolvedValueOnce({
      ...order,
      status: 'PAID',
      confirmationEmailSentAt: null,
    });
    sendOrderConfirmation.mockRejectedValueOnce(
      new Error('Email indisponible'),
    );
    await expect(
      service.handleWebhookEvent(Buffer.from('{}'), 'signature'),
    ).rejects.toThrow('Email indisponible');
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'PAID' },
    });
    expect(updateMany).toHaveBeenCalledTimes(1);
  });
});
