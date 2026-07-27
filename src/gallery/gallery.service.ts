import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.galleryPhoto.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const photo = await this.prisma.galleryPhoto.findUnique({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundException('Photo introuvable.');
    }

    return photo;
  }

  create(dto: CreateGalleryPhotoDto) {
    return this.prisma.galleryPhoto.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateGalleryPhotoDto) {
    await this.findOne(id);

    return this.prisma.galleryPhoto.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.galleryPhoto.delete({
      where: { id },
    });

    return {
      message: 'Photo supprimée avec succès.',
    };
  }
}