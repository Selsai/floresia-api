// Rôle : Règles métier et accès aux données.
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') ?? '',
    );
  }

  // ==========================
  // Créer une session de paiement Stripe
  // ==========================
  async createCheckoutSession(orderId: string, userId: string) {
    // Recalcule et contrôle le montant côté serveur.
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true } },
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

    const billing =
      order.billingAddress &&
      typeof order.billingAddress === 'object' &&
      !Array.isArray(order.billingAddress)
        ? order.billingAddress
        : null;
    let customerId: string | undefined;
    if (
      billing &&
      typeof billing.street === 'string' &&
      billing.street &&
      typeof billing.zipCode === 'string' &&
      typeof billing.city === 'string'
    ) {
      const customer = await this.stripe.customers.create(
        {
          email: order.user?.email,
          name:
            typeof billing.fullName === 'string' ? billing.fullName : undefined,
          address: {
            line1: billing.street,
            line2:
              typeof billing.complement === 'string'
                ? billing.complement
                : undefined,
            postal_code: billing.zipCode,
            city: billing.city,
            country: 'FR',
          },
          metadata: { orderId: order.id },
        },
        { idempotencyKey: `order-customer/${order.id}` },
      );
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      ...(customerId
        ? { customer: customerId }
        : { customer_email: order.user?.email }),
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: { orderId: order.id },
          description: `Commande Florésia ${order.id}`,
          footer:
            'Merci pour votre confiance. Retrouvez votre commande sur floresia.fr.',
        },
      },
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

    await this.prisma.order.updateMany({
      where: { id: order.id, userId, status: 'PENDING' },
      data: { stripeCheckoutSessionId: session.id },
    });
    return {
      checkoutUrl: session.url,
    };
  }

  async getOrderDocument(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId)
      throw new ForbiddenException('Accès non autorisé à cette commande');
    if (
      !['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
    ) {
      throw new BadRequestException(
        'La facture sera disponible après le paiement.',
      );
    }
    let sessionId = order.stripeCheckoutSessionId;
    // Compatibilité avec les paiements antérieurs à l’enregistrement de la session.
    if (!sessionId) {
      const sessions = await this.stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: Math.floor(order.createdAt.getTime() / 1000) - 60 },
      });
      sessionId =
        sessions.data.find(
          (session) =>
            session.metadata?.orderId === orderId &&
            session.payment_status === 'paid',
        )?.id ?? null;
      if (sessionId)
        await this.prisma.order.updateMany({
          where: { id: orderId, userId },
          data: { stripeCheckoutSessionId: sessionId },
        });
    }
    if (!sessionId)
      throw new NotFoundException(
        'Aucun document de paiement disponible pour cette ancienne commande.',
      );
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['invoice', 'payment_intent.latest_charge'],
    });
    if (
      session.metadata?.orderId !== orderId ||
      session.payment_status !== 'paid' ||
      session.currency !== 'eur' ||
      session.amount_total !== Math.round(order.totalAmount * 100)
    ) {
      throw new BadRequestException(
        'Le document ne correspond pas au paiement de cette commande.',
      );
    }
    const invoice =
      typeof session.invoice === 'string'
        ? await this.stripe.invoices.retrieve(session.invoice)
        : session.invoice;
    if (invoice?.hosted_invoice_url)
      return { type: 'invoice', url: invoice.hosted_invoice_url };
    const intent =
      typeof session.payment_intent === 'string'
        ? await this.stripe.paymentIntents.retrieve(session.payment_intent, {
            expand: ['latest_charge'],
          })
        : session.payment_intent;
    const charge =
      typeof intent?.latest_charge === 'string'
        ? await this.stripe.charges.retrieve(intent.latest_charge)
        : intent?.latest_charge;
    if (charge?.receipt_url)
      return { type: 'receipt', url: charge.receipt_url };
    throw new NotFoundException(
      'Le document est en préparation. Réessayez dans quelques instants.',
    );
  }

  // ==========================
  // Traiter le webhook Stripe
  // ==========================
  async handleWebhookEvent(rawBody: Buffer, signature: string) {
    // Valide la signature avant de marquer la commande payée.
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
        await this.applyPaidSession(session);
      }
    }
    return { received: true };
  }

  // Vérification serveur au retour du paiement, indépendante du délai du webhook.
  async confirmOrderPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId)
      throw new ForbiddenException('Accès non autorisé à cette commande');
    if (order.status === 'CANCELLED') {
      return {
        status: order.status,
        paid: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
          order.status,
        ),
      };
    }
    let sessionId = order.stripeCheckoutSessionId;
    if (!sessionId) {
      const sessions = await this.stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: Math.floor(order.createdAt.getTime() / 1000) - 60 },
      });
      sessionId =
        sessions.data.find(
          (item) =>
            item.metadata?.orderId === order.id &&
            item.payment_status === 'paid',
        )?.id ?? null;
      if (sessionId)
        await this.prisma.order.updateMany({
          where: { id: order.id, userId },
          data: { stripeCheckoutSessionId: sessionId },
        });
    }
    if (!sessionId)
      return {
        status: order.status,
        paid: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
          order.status,
        ),
      };
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderId !== orderId)
      throw new BadRequestException(
        'Le paiement ne correspond pas à cette commande.',
      );
    if (session.payment_status !== 'paid')
      return { status: order.status, paid: false };
    try {
      await this.applyPaidSession(session);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const current = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (
        !current ||
        !['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(current.status)
      )
        throw error;
      this.logger.warn(
        'Paiement validé ; la confirmation email reste à réessayer.',
      );
    }
    const current = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    return {
      status: current?.status ?? order.status,
      confirmationEmailSentAt: current?.confirmationEmailSentAt ?? null,
      paid: Boolean(
        current &&
        ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(current.status),
      ),
    };
  }

  private async applyPaidSession(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId || session.payment_status !== 'paid')
      throw new BadRequestException('Paiement non confirmé.');
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
      data: {
        status: 'PAID',
        ...(session.id ? { stripeCheckoutSessionId: session.id } : {}),
      },
    });
    const confirmed = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { email: true, firstName: true, accountErasedAt: true },
        },
        address: true,
        items: { include: { product: true } },
      },
    });
    if (
      confirmed &&
      !confirmed.user?.accountErasedAt &&
      ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
        confirmed.status,
      ) &&
      !confirmed.confirmationEmailSentAt
    ) {
      try {
        await this.mail.sendOrderConfirmation(confirmed);
        await this.prisma.order.updateMany({
          where: { id: orderId, confirmationEmailSentAt: null },
          data: { confirmationEmailSentAt: new Date() },
        });
      } catch (error) {
        const reason =
          error instanceof Error && error.name === 'OrderEmailDeliveryError'
            ? error.message
            : 'Erreur temporaire du service email.';
        this.logger.warn(
          `Paiement confirmé ; ${reason} Confirmation à réessayer.`,
        );
        throw error;
      }
    }
  }
}
