import { Injectable, NotFoundException } from '@nestjs/common';
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
  async createCheckoutSession(orderId: string) {
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

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name,
          },
          unit_amount: Math.round(item.unitPrice * 100), // Stripe attend des centimes
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id,
      },
      success_url: `${frontendUrl}/floresia-app/commande/succes?orderId=${order.id}`,
      cancel_url: `${frontendUrl}/floresia-app/commande/annulee?orderId=${order.id}`,
    });

    return {
      checkoutUrl: session.url,
    };
  }

  // ==========================
  // Traiter le webhook Stripe
  // ==========================
async handleWebhookEvent(rawBody: Buffer, signature: string) {
  const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

  const event = this.stripe.webhooks.constructEvent(
    rawBody, // ici rawBody = req.body
    signature,
    webhookSecret ?? '',
  );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        });
      }
    }

    return { received: true };
  }
}