// Rôle : Tests automatisés de cette fonctionnalité.
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
describe('AuthService : comptes et récupération', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwt = { sign: jest.fn() };
  const mail = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetLink: jest.fn(),
  };
  const user = {
    id: 'user-1',
    email: 'flora@example.test',
    firstName: 'Flora',
    lastName: 'Test',
    role: 'USER',
    passwordHash: 'hash',
    isEmailVerified: false,
  };
  let service: AuthService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      mail as unknown as MailService,
    );
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);
    prisma.user.create.mockResolvedValue(user);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jwt.sign.mockReturnValue('signed-jwt');
  });
  it('refuse une inscription avec un email existant', async () => {
    await expect(
      service.register({
        email: user.email,
        password: 'password123',
        firstName: 'Flora',
        lastName: 'Test',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
  it('normalise, hache et envoie un code valable dix minutes à la création', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const before = Date.now();
    await service.register({
      email: ' FLORA@example.test ',
      password: 'password123',
      firstName: 'Flora',
      lastName: 'Test',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: user.email,
          passwordHash: 'new-hash',
        }),
      }),
    );
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.verificationCode).toMatch(/^\d{6}$/);
    expect(data.verificationCodeExpires.getTime()).toBeGreaterThanOrEqual(
      before + 600000,
    );
    expect(mail.sendVerificationCode).toHaveBeenCalledWith(
      user.email,
      data.verificationCode,
    );
  });
  it.each([null, user])(
    'refuse une connexion incorrecte sans JWT (%p)',
    async (candidate) => {
      prisma.user.findUnique.mockResolvedValue(candidate);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
      await expect(
        service.login({ email: user.email, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.sign).not.toHaveBeenCalled();
    },
  );
  it('renvoie un JWT et un profil sans hash de mot de passe', async () => {
    const result = await service.login({
      email: ' FLORA@example.test ',
      password: 'password123',
    });
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: 'USER',
    });
    expect(result.token).toBe('signed-jwt');
    expect(result.user).not.toHaveProperty('passwordHash');
  });
  it('refuse un profil absent', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile(user.id)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
  it('limite les champs demandés pour le profil', async () => {
    await service.getProfile(user.id);
    const select = prisma.user.findUnique.mock.calls[0][0].select;
    expect(select.isEmailVerified).toBe(true);
    expect(select).not.toHaveProperty('passwordHash');
    expect(select).not.toHaveProperty('resetToken');
  });
  it('refuse de prendre l’email d’un autre compte', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'other' });
    await expect(
      service.updateProfile(user.id, { email: 'other@example.test' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it.each([null, user])(
    'normalise un nouvel email autorisé (%p)',
    async (existing) => {
      prisma.user.findUnique.mockResolvedValue(existing);
      await service.updateProfile(user.id, { email: ' FLORA@example.test ' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { email: user.email } }),
      );
    },
  );
  it('modifie le prénom sans rechercher un email', async () => {
    await service.updateProfile(user.id, { firstName: 'Rose' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { firstName: 'Rose' } }),
    );
  });
  const passwords = {
    currentPassword: 'old-password',
    newPassword: 'new-password',
    confirmPassword: 'new-password',
  };
  it('refuse deux nouveaux mots de passe différents', async () => {
    await expect(
      service.changePassword(user.id, {
        ...passwords,
        confirmPassword: 'different',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('refuse un changement pour un compte absent', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.changePassword(user.id, passwords),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('refuse un mot de passe actuel incorrect', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      service.changePassword(user.id, passwords),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('refuse de réutiliser le même mot de passe', async () => {
    await expect(
      service.changePassword(user.id, passwords),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('enregistre seulement le hash du nouveau mot de passe', async () => {
    jest
      .mocked(bcrypt.compare)
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(false as never);
    await service.changePassword(user.id, passwords);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { passwordHash: 'new-hash' },
    });
  });
  it.each([null, { ...user, isEmailVerified: true }])(
    'refuse un renvoi de code inutile (%p)',
    async (candidate) => {
      prisma.user.findUnique.mockResolvedValue(candidate);
      await expect(
        service.sendVerificationCode(user.email),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    },
  );
  it('renouvelle le code pour un email normalisé', async () => {
    await service.sendVerificationCode(' FLORA@example.test ');
    expect(mail.sendVerificationCode).toHaveBeenCalledWith(
      user.email,
      expect.stringMatching(/^\d{6}$/),
    );
  });
  it.each([
    null,
    user,
    {
      ...user,
      verificationCode: '123456',
      verificationCodeExpires: new Date(0),
    },
    {
      ...user,
      verificationCode: '654321',
      verificationCodeExpires: new Date(Date.now() + 600000),
    },
  ])('refuse un code absent, expiré ou incorrect (%p)', async (candidate) => {
    prisma.user.findUnique.mockResolvedValue(candidate);
    await expect(
      service.verifyEmail({ email: user.email, code: '123456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('valide un code correct puis le supprime', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      verificationCode: '123456',
      verificationCodeExpires: new Date(Date.now() + 600000),
    });
    await service.verifyEmail({ email: user.email, code: '123456' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });
  });
  it('ne révèle pas si un compte existe dans la réponse de récupération', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    const absent = await service.forgotPassword(user.email);
    const present = await service.forgotPassword(user.email);
    expect(present).toEqual(absent);
    expect(present).not.toHaveProperty('devToken');
    expect(mail.sendPasswordResetLink).toHaveBeenCalledTimes(1);
  });
  it('génère un token aléatoire et une expiration d’une heure', async () => {
    await service.forgotPassword(user.email);
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.resetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(data.resetTokenExpires.getTime()).toBeGreaterThan(
      Date.now() + 3590000,
    );
    expect(mail.sendPasswordResetLink).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining(data.resetToken),
    );
  });
  it('refuse un lien de récupération invalide ou expiré', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.resetPassword('invalid', 'new-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('réinitialise le mot de passe et invalide le token utilisé', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    await service.resetPassword('valid-token', 'new-password');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        resetToken: 'valid-token',
        resetTokenExpires: { gt: expect.any(Date) },
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        passwordHash: 'new-hash',
        resetToken: null,
        resetTokenExpires: null,
      },
    });
  });
});
