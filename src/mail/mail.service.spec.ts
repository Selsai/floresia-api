import { MailService } from './mail.service';
import { Resend } from 'resend';
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest
        .fn()
        .mockResolvedValue({ data: { id: 'email-test' }, error: null }),
    },
  })),
}));
describe('Email de confirmation Florésia', () => {
  const order = {
    id: 'order-test',
    totalAmount: 37.9,
    deliveryMethod: 'DELIVERY',
    deliveryDate: new Date('2026-10-15T12:00:00Z'),
    user: { email: 'flora@example.test', firstName: '<Flora>' },
    address: { street: '1 rue de Test', zipCode: '75001', city: 'Paris' },
    items: [{ quantity: 1, unitPrice: 32, product: { name: '<Rose>' } }],
  };
  it('échappe le contenu, précise le mode test et utilise une clé unique par commande', async () => {
    const service = new MailService();
    await service.sendOrderConfirmation(order);
    const send = (Resend as unknown as jest.Mock).mock.results.at(-1)!.value
      .emails.send;
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'flora@example.test',
        html: expect.stringContaining('&lt;Flora&gt;'),
      }),
      { idempotencyKey: 'order-confirmation/order-test' },
    );
    const html = send.mock.calls[0][0].html;
    expect(html).toContain('&lt;Rose&gt;');
    expect(html).toContain('mode test');
    expect(html).toContain('1 rue de Test');
  });
  it('signale les erreurs du prestataire pour permettre un nouvel essai', async () => {
    const service = new MailService();
    const send = (Resend as unknown as jest.Mock).mock.results.at(-1)!.value
      .emails.send;
    send.mockResolvedValueOnce({
      data: null,
      error: { message: 'Indisponible' },
    });
    await expect(service.sendOrderConfirmation(order)).rejects.toThrow(
      'Envoi de confirmation',
    );
  });
});
