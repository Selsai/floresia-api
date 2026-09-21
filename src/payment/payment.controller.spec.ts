import request from 'supertest';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { createHttpFixture } from '../../test/http-fixture';
describe('PaymentController : identité et webhook brut', () => {
  let fixture: Awaited<ReturnType<typeof createHttpFixture>>;
  const service = { createCheckoutSession: jest.fn().mockResolvedValue({ url: 'https://checkout.example.test' }), handleWebhookEvent: jest.fn().mockResolvedValue({ received: true }) };
  beforeAll(async () => { fixture = await createHttpFixture(PaymentController, PaymentService, service); });
  afterAll(async () => fixture.app.close());
  beforeEach(() => jest.clearAllMocks());
  it('refuse une session sans compte connecté', async () => {
    await request(fixture.app.getHttpServer()).post('/payment/checkout-session').send({ orderId: 'order-test' }).expect(401);
    expect(service.createCheckoutSession).not.toHaveBeenCalled();
  });
  it('refuse une injection de propriétaire', async () => {
    await request(fixture.app.getHttpServer()).post('/payment/checkout-session').set('Authorization', 'Bearer ' + fixture.userToken).send({ orderId: 'order-test', userId: 'other' }).expect(400);
    expect(service.createCheckoutSession).not.toHaveBeenCalled();
  });
  it('associe la session à l’identité signée du compte', async () => {
    await request(fixture.app.getHttpServer()).post('/payment/checkout-session').set('Authorization', 'Bearer ' + fixture.userToken).send({ orderId: 'order-test' }).expect(201);
    expect(service.createCheckoutSession).toHaveBeenCalledWith('order-test', 'user-test');
  });
  it('transmet les octets exacts et la signature au service du webhook', async () => {
    const body = '{ "id": "evt-test", "data": {} }';
    await request(fixture.app.getHttpServer()).post('/payment/webhook').set('Content-Type', 'application/json').set('stripe-signature', 'signature-test').send(body).expect(201);
    expect(service.handleWebhookEvent).toHaveBeenCalledWith(Buffer.from(body), 'signature-test');
  });
});