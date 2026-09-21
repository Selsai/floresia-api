import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { ChatbotService } from '../src/chatbot/chatbot.service';
import { CUSTOM_BOUQUET_PRODUCT_ID } from '../src/chatbot/catalog-replies';

const checkout = jest.fn().mockResolvedValue({ url: 'https://checkout.example.test/session' });
let webhookEvent: object;
jest.mock('stripe', () => jest.fn().mockImplementation(() => ({
  checkout: { sessions: { create: checkout } },
  webhooks: { constructEvent: jest.fn(() => webhookEvent) },
})));
type Item = { quantity: number; unitPrice: number; product: { id: string; name: string } };
type Order = { id: string; userId: string; totalAmount: number; status: string; items: Item[] };
type CreateData = { data: { totalAmount: number; user: { connect: { id: string } }; items: { create: { quantity: number; unitPrice: number; product: { connect: { id: string } } }[] } } };

// Application réelle, persistance en mémoire et fournisseurs externes simulés.
// Aucun email, appel Gemini, paiement ou écriture dans la base réelle.
describe('Application Florésia : commande et paiement via HTTP', () => {
  let app: INestApplication<App>;
  let token: string;
  let otherToken: string;
  let emailVerified = true;
  const orders = new Map<string, Order>();
  const products = [{ id: 'p', name: 'Romance', price: 32 }, { id: CUSTOM_BOUQUET_PRODUCT_ID, name: 'Bouquet personnalisé', price: 0 }];
  const flowers = [
    { id: 'rose', name: 'Rose', color: 'Rose', price: 3.5, stock: 100, isSecondary: false },
    { id: 'eucalyptus', name: 'Eucalyptus', color: 'Vert', price: 2, stock: 100, isSecondary: true },
  ];
  const prisma = {
    user: { findUnique: jest.fn(() => ({ id: 'u', isEmailVerified: emailVerified })) },
    address: { findUnique: jest.fn(() => ({ id: 'addr', userId: 'u' })) },
    product: { findMany: jest.fn(() => products) },
    flower: { findMany: jest.fn(() => flowers) },
    order: {
      create: jest.fn(({ data }: CreateData) => {
        const order: Order = { id: 'order-' + orders.size, userId: data.user.connect.id, totalAmount: data.totalAmount, status: 'PENDING', items: data.items.create.map(item => ({ quantity: item.quantity, unitPrice: item.unitPrice, product: { id: item.product.connect.id, name: products.find(p => p.id === item.product.connect.id)!.name } })) };
        orders.set(order.id, order); return order;
      }),
      findUnique: jest.fn(({ where }: { where: { id: string } }) => orders.get(where.id)),
      findMany: jest.fn(() => [...orders.values()]),
      updateMany: jest.fn(({ where, data }: { where: { id: string; status: string }; data: { status: string } }) => {
        const order = orders.get(where.id);
        if (!order || order.status !== where.status) return { count: 0 };
        order.status = data.status; return { count: 1 };
      }),
    },
  };
  const config: Record<string, string> = { JWT_SECRET: 'test-only-secret-for-http-integration', JWT_EXPIRES_IN: '1h', STRIPE_SECRET_KEY: 'sk_test_local_only', STRIPE_WEBHOOK_SECRET: 'whsec_test_local_only', FRONTEND_URL: 'http://localhost:5173' };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(ConfigService).useValue({ get: (key: string) => config[key], getOrThrow: (key: string) => { if (!(key in config)) throw new Error('Missing test config: ' + key); return config[key]; } })
      .overrideProvider(MailService).useValue({ sendVerificationCode: jest.fn(), sendPasswordResetLink: jest.fn() })
      .overrideProvider(ChatbotService).useValue({ sendMessage: jest.fn().mockResolvedValue({ reply: 'Réponse de test' }) })
      .compile();
    app = module.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    const jwt = module.get(JwtService);
    token = jwt.sign({ sub: 'u', email: 'flora@example.test', role: 'USER' });
    otherToken = jwt.sign({ sub: 'other', email: 'other@example.test', role: 'USER' });
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => { orders.clear(); emailVerified = true; jest.clearAllMocks(); });
  const standard = { addressId: 'addr', items: [{ productId: 'p', quantity: 1, unitPrice: 0.01 }], totalAmount: 0.01 };
  it('charge le catalogue sans authentification', async () => {
    const response = await request(app.getHttpServer()).get('/products').expect(200);
    expect(response.body).toEqual(products);
  });
  it('refuse une commande sans compte', async () => {
    await request(app.getHttpServer()).post('/orders').send(standard).expect(401); expect(orders.size).toBe(0);
  });
  it('refuse une commande avant vérification de l’email', async () => {
    emailVerified = false;
    await request(app.getHttpServer()).post('/orders').set('Authorization', 'Bearer ' + token).send(standard).expect(403);
    expect(orders.size).toBe(0);
  });
  it('refuse une adresse appartenant à un autre compte', async () => {
    await request(app.getHttpServer()).post('/orders').set('Authorization', 'Bearer ' + otherToken).send(standard).expect(403); expect(orders.size).toBe(0);
  });
  it('refuse une quantité fractionnaire avant la création', async () => {
    await request(app.getHttpServer()).post('/orders').set('Authorization', 'Bearer ' + token).send({ ...standard, items: [{ productId: 'p', quantity: 1.5 }] }).expect(400);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });
  it('recalcule le prix, transmet les frais à Stripe puis confirme uniquement le montant attendu', async () => {
    const created = await request(app.getHttpServer()).post('/orders').set('Authorization', 'Bearer ' + token).send(standard).expect(201);
    const id = created.body.id as string;
    expect(created.body.totalAmount).toBe(37.9);
    expect(created.body.items[0].unitPrice).toBe(32);
    await request(app.getHttpServer()).post('/payment/checkout-session').set('Authorization', 'Bearer ' + otherToken).send({ orderId: id }).expect(403);
    expect(checkout).not.toHaveBeenCalled();
    await request(app.getHttpServer()).post('/payment/checkout-session').set('Authorization', 'Bearer ' + token).send({ orderId: id }).expect(201);
    expect(checkout).toHaveBeenCalledWith(expect.objectContaining({ line_items: [
      expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 3200 }), quantity: 1 }),
      expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 590 }), quantity: 1 }),
    ] }));
    webhookEvent = { type: 'checkout.session.completed', data: { object: { metadata: { orderId: id }, payment_status: 'paid', currency: 'eur', amount_total: 3790 } } };
    await request(app.getHttpServer()).post('/payment/webhook').set('stripe-signature', 'test-signature').send({ id: 'evt' }).expect(201);
    const confirmed = await request(app.getHttpServer()).get('/orders/' + id).set('Authorization', 'Bearer ' + token).expect(200);
    expect(confirmed.body.status).toBe('PAID');
    await request(app.getHttpServer()).post('/payment/webhook').set('stripe-signature', 'test-signature').send({ id: 'evt' }).expect(201);
    expect(orders.get(id)?.status).toBe('PAID');
  });
  it('calcule une composition à la tige et conserve le détail du panier', async () => {
    const response = await request(app.getHttpServer()).post('/orders').set('Authorization', 'Bearer ' + token).send({
      addressId: 'addr',
      items: [{ productId: CUSTOM_BOUQUET_PRODUCT_ID, quantity: 1, customBouquet: { flowers: [{ flowerId: 'rose', quantity: 3 }, { flowerId: 'eucalyptus', quantity: 1 }] } }],
    }).expect(201);
    expect(response.body.items[0].unitPrice).toBe(12.5); expect(response.body.totalAmount).toBe(18.4);
  });
  it('refuse un utilisateur sur les routes réservées à l’administration', async () => {
    await request(app.getHttpServer()).get('/users').set('Authorization', 'Bearer ' + token).expect(403);
  });
});