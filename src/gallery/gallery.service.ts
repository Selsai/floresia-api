// Rôle : Règles métier et accès aux données.
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';
import { SubmitGalleryPhotoDto } from './dto/submit-gallery-photo.dto';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.galleryPhoto.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const photo = await this.prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Photo introuvable.');
    return photo;
  }

  create(dto: CreateGalleryPhotoDto) {
    return this.prisma.galleryPhoto.create({ data: dto });
  }

  async update(id: string, dto: UpdateGalleryPhotoDto) {
    await this.findOne(id);
    return this.prisma.galleryPhoto.update({ where: { id }, data: dto });
  }

  async submit(userId: string, dto: SubmitGalleryPhotoDto, imageUrl: string) {
    // Réserve la publication aux emails vérifiés.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Veuillez vérifier votre adresse email avant de pouvoir partager une photo.',
      );
    }

    return this.prisma.galleryPhoto.create({
      data: {
        imageUrl,
        caption: dto.caption,
        instagramHandle: dto.instagramHandle,
        authorId: userId,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    // Autorise le propriétaire ou un administrateur.
    const photo = await this.findOne(id);

    if (role !== 'ADMIN' && photo.authorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre photo.',
      );
    }

    await this.prisma.galleryPhoto.delete({ where: { id } });
    return { message: 'Photo supprimée avec succès.' };
  }
}
