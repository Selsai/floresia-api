import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from './dto/update-user-role.dto';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
describe('UsersService : données privées et administration', () => {
  const user = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  let service: UsersService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService({ user } as unknown as PrismaService);
    user.findUnique.mockResolvedValue({ id: 'u' });
  });
  it('exclut les mots de passe et tokens de la liste', async () => {
    await service.findAll();
    const select = user.findMany.mock.calls[0][0].select;
    expect(select.email).toBe(true);
    expect(select).not.toHaveProperty('passwordHash');
    expect(select).not.toHaveProperty('resetToken');
  });
  it('exclut les secrets du profil administratif', async () => {
    await service.findOne('u');
    const select = user.findUnique.mock.calls[0][0].select;
    expect(select.id).toBe(true);
    expect(select).not.toHaveProperty('verificationCode');
  });
  it.each(['findOne', 'updateRole', 'remove'] as const)(
    'refuse %s d’un compte absent',
    async (method) => {
      user.findUnique.mockResolvedValue(null);
      const result =
        method === 'updateRole'
          ? service.updateRole('u', { role: UserRole.ADMIN })
          : service[method]('u');
      await expect(result).rejects.toBeInstanceOf(NotFoundException);
      expect(user.update).not.toHaveBeenCalled();
      expect(user.delete).not.toHaveBeenCalled();
    },
  );
  it('limite la modification du rôle et les champs retournés', async () => {
    await service.updateRole('u', { role: UserRole.ADMIN });
    const query = user.update.mock.calls[0][0];
    expect(query.data).toEqual({ role: UserRole.ADMIN });
    expect(query.select).not.toHaveProperty('passwordHash');
  });
  it('supprime un compte sans données associées', async () => {
    await service.remove('u');
    expect(user.delete).toHaveBeenCalledWith({ where: { id: 'u' } });
  });
  it('explique le refus de suppression d’un compte référencé', async () => {
    user.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('constraint', {
        code: 'P2003',
        clientVersion: '5.22.0',
      }),
    );
    await expect(service.remove('u')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it('propage une panne inattendue', async () => {
    const error = new Error('offline');
    user.delete.mockRejectedValue(error);
    await expect(service.remove('u')).rejects.toBe(error);
  });
});
