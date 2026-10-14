import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import { AccountDeletionService } from './account-deletion.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('fs/promises', () => ({ unlink: jest.fn() }));

describe('Suppression différée et récupération sécurisée du compte', () => {
  const user = {
    id: 'u',
    email: 'client@example.test',
    firstName: 'Exemple',
    role: 'USER',
    passwordHash: 'hash',
    sessionVersion: 0,
    deletionDeadline: new Date(Date.now() + 86400000),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    order: { findMany: jest.fn() },
    favorite: { deleteMany: jest.fn() },
    comment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    testimonial: { deleteMany: jest.fn() },
    galleryPhoto: { findMany: jest.fn(), deleteMany: jest.fn() },
    article: { updateMany: jest.fn() },
    address: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const mail = { sendAccountDeletion: jest.fn() };
  let service: AccountDeletionService;
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.comment.findMany.mockResolvedValue([]);
    prisma.galleryPhoto.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    service = new AccountDeletionService(
      prisma as unknown as PrismaService,
      mail as unknown as MailService,
    );
  });
  it('refuse un mauvais mot de passe sans envoyer de mail', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      service.requestDeletion('u', 'incorrect'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mail.sendAccountDeletion).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
  it('garde le compte actif si l’email est refusé', async () => {
    mail.sendAccountDeletion.mockRejectedValue(
      new Error('Provider unavailable'),
    );
    await expect(service.requestDeletion('u', 'correct')).rejects.toThrow(
      'Provider unavailable',
    );
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
  it('envoie un lien de 30 jours, conserve seulement son hash et révoque les sessions', async () => {
    const before = Date.now();
    const result = await service.requestDeletion('u', 'correct');
    const link = mail.sendAccountDeletion.mock.calls[0][2] as string;
    const token = new URL(link).hash.split('token=')[1];
    const data = prisma.user.updateMany.mock.calls[0][0].data;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(data.deletionTokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(data.deletionTokenHash).not.toBe(token);
    expect(result.deadline.getTime() - before).toBeGreaterThanOrEqual(
      30 * 86400000,
    );
    expect(data.sessionVersion).toEqual({ increment: 1 });
    expect(data.resetToken).toBeNull();
  });
  it('refuse un compte administrateur', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, role: 'ADMIN' });
    await expect(
      service.requestDeletion('u', 'correct'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mail.sendAccountDeletion).not.toHaveBeenCalled();
  });
  it('refuse un lien expiré ou réutilisé', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.restore('a'.repeat(64), 'ExempleMotDePasse!12'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
  it('remplace le mot de passe, invalide le lien et toutes les anciennes sessions', async () => {
    await service.restore('a'.repeat(64), 'ExempleMotDePasse!12');
    expect(bcrypt.hash).toHaveBeenCalledWith('ExempleMotDePasse!12', 12);
    const { where, data } = prisma.user.updateMany.mock.calls[0][0];
    expect(where.deletionDeadline.gt).toBeInstanceOf(Date);
    expect(data).toMatchObject({
      passwordHash: 'new-hash',
      deletionTokenHash: null,
      deletionRequestedAt: null,
      sessionVersion: { increment: 1 },
    });
  });
  it('refuse une réactivation concurrente après consommation du lien', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.restore('a'.repeat(64), 'ExempleMotDePasse!12'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('ne montre que les commandes payées du propriétaire du lien', async () => {
    await service.access('a'.repeat(64));
    expect(prisma.order.findMany.mock.calls[0][0].where).toMatchObject({
      userId: 'u',
      status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
    });
  });
  it('ne nettoie pas un compte réactivé pendant le passage du traitement', async () => {
    prisma.user.findMany.mockResolvedValueOnce([{ id: 'u' }]);
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await service.expireAccounts();
    expect(prisma.favorite.deleteMany).not.toHaveBeenCalled();
  });
  it('efface le profil et les contributions après le délai, préserve les adresses rattachées aux commandes', async () => {
    prisma.user.findMany.mockResolvedValueOnce([{ id: 'u' }]);
    await service.expireAccounts();
    expect(prisma.user.updateMany.mock.calls[0][0].data).toMatchObject({
      email: 'deleted-u@example.invalid',
      firstName: 'Compte',
      lastName: 'supprimé',
      deletionTokenHash: null,
    });
    expect(prisma.address.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u', orders: { none: {} } },
    });
    expect(prisma.comment.deleteMany).toHaveBeenCalledWith({
      where: { authorId: 'u' },
    });
  });
  it('nettoie seulement les fichiers uploadés, sans accepter une traversée de chemin', async () => {
    prisma.user.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'u',
        pendingMediaDeletion: [
          '/uploads/gallery/photo.webp',
          '/uploads/gallery/../../secret.webp',
        ],
      },
    ]);
    await service.expireAccounts();
    expect(unlink).toHaveBeenCalledTimes(1);
    expect(unlink).toHaveBeenCalledWith(
      expect.stringMatching(/[\\/]uploads[\\/]gallery[\\/]photo\.webp$/),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u' },
      data: { pendingMediaDeletion: ['/uploads/gallery/../../secret.webp'] },
    });
  });
});
