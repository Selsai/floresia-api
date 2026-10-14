// Rôle : Tests automatisés de cette fonctionnalité.
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { PrismaService } from '../prisma/prisma.service';
describe('AddressesService : propriété des adresses', () => {
  const address = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  };
  let service: AddressesService;
  const dto = {
    label: 'Maison',
    street: '1 rue des Tests',
    city: 'Paris',
    zipCode: '75001',
    fullName: 'Flora Test',
    phone: '0612345678',
  };
  beforeEach(() => {
    jest.resetAllMocks();
    service = new AddressesService({ address } as unknown as PrismaService);
    address.findUnique.mockResolvedValue({
      ...dto,
      id: 'a',
      userId: 'u',
      purpose: 'DELIVERY',
    });
  });
  it('limite la liste au compte connecté', async () => {
    await service.findAll('u');
    expect(address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u' } }),
    );
  });
  it('accepte une facturation à Lyon sans téléphone', async () => {
    await service.create('u', {
      ...dto,
      purpose: 'BILLING',
      city: 'Lyon',
      zipCode: '69001',
      phone: undefined,
    });
    expect(address.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ purpose: 'BILLING', zipCode: '69001' }),
      }),
    );
  });
  it('refuse une livraison en dehors de Paris', async () => {
    await expect(
      service.create('u', { ...dto, zipCode: '69001' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(address.create).not.toHaveBeenCalled();
  });
  it('accepte le code postal parisien 75116', async () => {
    await service.create('u', { ...dto, zipCode: '75116' });
    expect(address.create).toHaveBeenCalled();
  });
  it('associe le propriétaire et le pays par défaut à la création', async () => {
    await service.create('u', dto);
    expect(address.create).toHaveBeenCalledWith({
      data: { ...dto, userId: 'u', country: 'France' },
    });
    expect(address.updateMany).not.toHaveBeenCalled();
  });
  it('attribue le premier libellé disponible lorsque le champ est vide', async () => {
    address.findMany.mockResolvedValue([
      { label: 'Adresse 1' },
      { label: 'Adresse 3' },
    ]);
    await service.create('u', { ...dto, label: '' });
    expect(address.create).toHaveBeenCalledWith({
      data: { ...dto, label: 'Adresse 2', userId: 'u', country: 'France' },
    });
  });
  it('désactive les adresses par défaut uniquement pour ce compte', async () => {
    await service.create('u', { ...dto, isDefault: true, country: 'France' });
    expect(address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u', purpose: 'DELIVERY' },
      data: { isDefault: false },
    });
    expect(address.create).toHaveBeenCalledWith({
      data: { ...dto, isDefault: true, country: 'France', userId: 'u' },
    });
  });
  it.each(['update', 'remove'] as const)(
    'refuse %s d’une adresse absente',
    async (method) => {
      address.findUnique.mockResolvedValue(null);
      const result =
        method === 'update'
          ? service.update('u', 'a', dto)
          : service.remove('u', 'a');
      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it.each(['update', 'remove'] as const)(
    'refuse %s d’une adresse d’un autre compte',
    async (method) => {
      const result =
        method === 'update'
          ? service.update('other', 'a', dto)
          : service.remove('other', 'a');
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      expect(address.delete).not.toHaveBeenCalled();
      expect(address.update).not.toHaveBeenCalled();
    },
  );
  it('modifie une adresse sans toucher aux autres', async () => {
    await service.update('u', 'a', { city: 'Lyon' });
    expect(address.update).toHaveBeenCalledWith({
      where: { id: 'a' },
      data: { city: 'Lyon' },
    });
    expect(address.updateMany).not.toHaveBeenCalled();
  });
  it('change l’adresse par défaut du même compte', async () => {
    await service.update('u', 'a', { isDefault: true });
    expect(address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u', purpose: 'DELIVERY' },
      data: { isDefault: false },
    });
  });
  it('supprime une adresse appartenant au compte', async () => {
    await service.remove('u', 'a');
    expect(address.delete).toHaveBeenCalledWith({ where: { id: 'a' } });
  });
  it.each(['P2003', 'P2014'])(
    'explique le refus d’une adresse liée à une commande (%s)',
    async (code) => {
      address.delete.mockRejectedValue({ code });
      await expect(service.remove('u', 'a')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
  it('conserve les erreurs techniques inattendues', async () => {
    const error = new Error('database unavailable');
    address.delete.mockRejectedValue(error);
    await expect(service.remove('u', 'a')).rejects.toBe(error);
  });
});
