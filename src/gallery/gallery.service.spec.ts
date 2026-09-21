import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
describe('GalleryService : publication et propriété', () => {
  const model = { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const user = { findUnique: jest.fn() };
  let service: GalleryService;
  beforeEach(() => { jest.resetAllMocks(); service = new GalleryService({ galleryPhoto: model, user } as unknown as PrismaService); model.findUnique.mockResolvedValue({ id: 'p', authorId: 'u' }); user.findUnique.mockResolvedValue({ id: 'u', firstName: 'Flora', lastName: 'Test', isEmailVerified: true }); });
  it('liste les publications récentes', async () => {
    await service.findAll(); expect(model.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });
  it('retrouve une publication existante', async () => {
    expect(await service.findOne('p')).toEqual({ id: 'p', authorId: 'u' });
  });
  it('refuse une publication inconnue', async () => {
    model.findUnique.mockResolvedValue(null); await expect(service.findOne('p')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('enregistre les données validées par l’administration', async () => {
    const dto = {} as CreateGalleryPhotoDto; await service.create(dto); expect(model.create).toHaveBeenCalledWith({ data: dto });
  });
  it('refuse une mise à jour d’une publication inexistante', async () => {
    model.findUnique.mockResolvedValue(null); await expect(service.update('p', {})).rejects.toBeInstanceOf(NotFoundException); expect(model.update).not.toHaveBeenCalled();
  });
  it('met à jour la publication demandée', async () => {
    await service.update('p', {}); expect(model.update).toHaveBeenCalledWith({ where: { id: 'p' }, data: {} });
  });
  it('refuse une publication avec un compte absent', async () => {
    user.findUnique.mockResolvedValue(null); await expect(service.submit('u', { caption: 'Mon bouquet', instagramHandle: 'flora' }, '/uploads/test.png')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('refuse une publication avant vérification de l’email', async () => {
    user.findUnique.mockResolvedValue({ isEmailVerified: false }); await expect(service.submit('u', { caption: 'Mon bouquet', instagramHandle: 'flora' }, '/uploads/test.png')).rejects.toBeInstanceOf(ForbiddenException); expect(model.create).not.toHaveBeenCalled();
  });
  it('associe les données publiées au compte vérifié', async () => {
    await service.submit('u', { caption: 'Mon bouquet', instagramHandle: 'flora' }, '/uploads/test.png'); expect(model.create).toHaveBeenCalledWith({ data: { caption: 'Mon bouquet', instagramHandle: 'flora', imageUrl: '/uploads/test.png', authorId: 'u' } });
  });
  it('refuse de supprimer la publication d’un autre compte', async () => {
    await expect(service.remove('p', 'other', 'USER')).rejects.toBeInstanceOf(ForbiddenException); expect(model.delete).not.toHaveBeenCalled();
  });
  it.each([['u', 'USER'], ['admin', 'ADMIN']])('autorise le propriétaire ou un administrateur (%s)', async (id, role) => {
    await service.remove('p', id, role); expect(model.delete).toHaveBeenCalledWith({ where: { id: 'p' } });
  });
});