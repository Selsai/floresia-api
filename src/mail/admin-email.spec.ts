import { MailService } from './mail.service';
import { Resend } from 'resend';
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest
        .fn()
        .mockResolvedValue({ data: { id: 'example-mail' }, error: null }),
    },
  })),
}));
describe('Contenu des alertes administrateur', () => {
  const previous = process.env.ADMIN_NOTIFICATION_EMAIL;
  afterEach(() => {
    if (previous === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL;
    else process.env.ADMIN_NOTIFICATION_EMAIL = previous;
  });
  it('envoie à la destination fixe, échappe les textes et ignore les champs non autorisés', async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'contact.floresia@gmail.com';
    await new MailService().sendAdminNotification(
      'comment/exemple',
      'Nouveau commentaire',
      {
        name: '<Exemple>',
        content: '<script>test</script>',
        email: 'example@example.test',
        password: 'secret',
        street: 'adresse privée',
        token: 'token-secret',
      },
    );
    const send = (Resend as unknown as jest.Mock).mock.results.at(-1)!.value
      .emails.send;
    const [message, options] = send.mock.calls[0];
    expect(message.to).toBe('contact.floresia@gmail.com');
    expect(message.html).toContain('&lt;Exemple&gt;');
    expect(message.html).toContain('&lt;script&gt;');
    expect(message.html).not.toContain('secret');
    expect(message.html).not.toContain('adresse privée');
    expect(options.idempotencyKey).toBe('admin/comment/exemple');
  });
  it('refuse une destination non autorisée', async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'other@example.test';
    await expect(
      new MailService().sendAdminNotification('id', 'test', {}),
    ).rejects.toThrow('disabled');
  });
  it('remonte un refus Resend pour conserver le message en attente', async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'contact.floresia@gmail.com';
    const service = new MailService();
    const send = (Resend as unknown as jest.Mock).mock.results.at(-1)!.value
      .emails.send;
    send.mockResolvedValueOnce({ data: null, error: { name: 'rate_limit' } });
    await expect(
      service.sendAdminNotification('id', 'test', {}),
    ).rejects.toThrow('unavailable');
  });
});
