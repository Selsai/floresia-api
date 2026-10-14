// Rôle : Tests automatisés de cette fonctionnalité.
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
describe('JwtStrategy : configuration et identité', () => {
  it('refuse de démarrer sans secret JWT configuré', () => {
    const config = {
      getOrThrow: jest.fn(() => {
        throw new Error('Missing JWT_SECRET');
      }),
    };
    expect(
      () =>
        new JwtStrategy(
          config as unknown as ConfigService,
          {} as PrismaService,
        ),
    ).toThrow('Missing JWT_SECRET');
  });
  it('extrait les seuls champs nécessaires après validation du compte', async () => {
    const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'flora@example.test',
          role: 'USER',
          sessionVersion: 0,
        }),
      },
    };
    const strategy = new JwtStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
    expect(
      await strategy.validate({
        sub: 'u',
        email: 'flora@example.test',
        role: 'USER',
      }),
    ).toEqual({ userId: 'u', email: 'flora@example.test', role: 'USER' });
    expect(config.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });
  it.each([
    null,
    { deletionRequestedAt: new Date() },
    { accountErasedAt: new Date() },
    { sessionVersion: 2 },
  ])('refuse un compte supprimé ou une session révoquée', async (user) => {
    const strategy = new JwtStrategy(
      { getOrThrow: () => 'test-secret' } as unknown as ConfigService,
      {
        user: { findUnique: jest.fn().mockResolvedValue(user) },
      } as unknown as PrismaService,
    );
    await expect(
      strategy.validate({
        sub: 'u',
        email: 'flora@example.test',
        role: 'USER',
        sessionVersion: 0,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
