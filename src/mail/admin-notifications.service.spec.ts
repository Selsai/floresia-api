import { AdminNotificationsService } from './admin-notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

describe('Alertes administrateur', () => {
  const previous = process.env.ADMIN_NOTIFICATION_EMAIL;
  afterEach(() => {
    if (previous === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL;
    else process.env.ADMIN_NOTIFICATION_EMAIL = previous;
  });
  const setup = () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = 'contact.floresia@gmail.com';
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'order-paid/exemple',
          title: 'Commande',
          payload: { amount: 42 },
          attempts: 1,
        },
      ]),
      adminNotification: {
        update: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const mail = {
      sendAdminNotification: jest.fn().mockResolvedValue(undefined),
    };
    return {
      prisma,
      mail,
      service: new AdminNotificationsService(
        prisma as unknown as PrismaService,
        mail as unknown as MailService,
      ),
    };
  };
  it('envoie puis efface les informations personnelles du message traité', async () => {
    const { prisma, mail, service } = setup();
    await service.flush();
    expect(mail.sendAdminNotification).toHaveBeenCalledWith(
      'order-paid/exemple',
      'Commande',
      { amount: 42 },
    );
    expect(prisma.adminNotification.update).toHaveBeenCalledWith({
      where: { id: 'order-paid/exemple' },
      data: { sentAt: expect.any(Date), payload: {} },
    });
  });
  it('conserve une alerte refusée pour une nouvelle tentative sans erreur métier', async () => {
    const { prisma, mail, service } = setup();
    mail.sendAdminNotification.mockRejectedValue(
      new Error('provider unavailable'),
    );
    await expect(service.flush()).resolves.toBeUndefined();
    expect(prisma.adminNotification.update).not.toHaveBeenCalled();
  });
  it('ne contacte rien sans destinataire autorisé', async () => {
    const { prisma, service } = setup();
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    await service.flush();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
  it('ne lance pas deux traitements concurrents dans la même instance', async () => {
    const { prisma, mail, service } = setup();
    let complete!: () => void;
    mail.sendAdminNotification.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const first = service.flush();
    await Promise.resolve();
    await service.flush();
    complete();
    await first;
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
