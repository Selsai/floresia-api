import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') ?? '',
    );
  }

  // ==========================
  // Créer une session de paiement Stripe
  // ==========================
  async createCheckoutSession(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    // Le propriétaire de la commande doit être vérifié avant tout appel à Stripe.
    if (order.userId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette commande');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        'Seule une commande en attente peut être payée.',
      );
    }

    const subtotalCents = order.items.reduce(
      (sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity,
      0,
    );
    const deliveryCents = Math.round(order.totalAmount * 100) - subtotalCents;
    if (
      !Number.isSafeInteger(subtotalCents) ||
      subtotalCents <= 0 ||
      ![0, 590].includes(deliveryCents)
    ) {
      throw new BadRequestException(
        'Le montant de cette commande est incohérent. Recréez-la depuis votre panier.',
      );
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        ...order.items.map((item) => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.product.name,
            },
            unit_amount: Math.round(item.unitPrice * 100), // Stripe attend des centimes
          },
          quantity: item.quantity,
        })),
        ...(deliveryCents
          ? [
              {
                price_data: {
                  currency: 'eur',
                  product_data: { name: 'Livraison' },
                  unit_amount: deliveryCents,
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      metadata: {
        orderId: order.id,
      },
      success_url: `${frontendUrl}/commande/succes?orderId=${order.id}`,
      cancel_url: `${frontendUrl}/commande/annulee?orderId=${order.id}`,
    });

    return {
      checkoutUrl: session.url,
    };
  }

  // ==========================
  // Traiter le webhook Stripe
  // ==========================
  async handleWebhookEvent(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    const event = this.stripe.webhooks.constructEvent(
      rawBody, // ici rawBody = req.body
      signature,
      webhookSecret ?? '',
    );

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === 'paid') {
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
        });
        if (!order) throw new NotFoundException('Commande introuvable');
        if (
          session.currency !== 'eur' ||
          session.amount_total !== Math.round(order.totalAmount * 100)
        ) {
          throw new BadRequestException(
            'Le paiement ne correspond pas au montant de la commande.',
          );
        }
        // Le filtre rend les événements répétés sans effet et évite de rétrograder un statut.
        await this.prisma.order.updateMany({
          where: { id: orderId, status: 'PENDING' },
          data: { status: 'PAID' },
        });
      }
    }
    return { received: true };
  }
}
