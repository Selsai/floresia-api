import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EmailVerifiedGuard } from './email-verified.guard';
import { PrismaService } from '../../prisma/prisma.service';
describe('EmailVerifiedGuard : accès conditionné à la vérification', () => {
  const findUnique = jest.fn();
  const guard = new EmailVerifiedGuard({ user: { findUnique } } as unknown as PrismaService);
  const context = (userId?: string) => ({ switchToHttp: () => ({ getRequest: () => ({ user: userId ? { userId } : undefined }) }) }) as ExecutionContext;
  beforeEach(() => jest.resetAllMocks());
  it('refuse un compte non authentifié sans accéder à la base', async () => { await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ForbiddenException); expect(findUnique).not.toHaveBeenCalled(); });
  it.each([null, { isEmailVerified: false }])('refuse un compte absent ou non vérifié (%p)', async (user) => { findUnique.mockResolvedValue(user); await expect(guard.canActivate(context('u'))).rejects.toBeInstanceOf(ForbiddenException); });
  it('autorise un compte vérifié', async () => { findUnique.mockResolvedValue({ isEmailVerified: true }); expect(await guard.canActivate(context('u'))).toBe(true); expect(findUnique).toHaveBeenCalledWith({ where: { id: 'u' } }); });
});