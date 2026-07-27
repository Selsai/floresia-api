import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateFlowerDto } from './dto/create-flower.dto';
import { UpdateFlowerDto } from './dto/update-flower.dto';

@Injectable()
export class FlowersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.flower.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.flower.findUnique({
      where: {
        id,
      },
    });
  }

  create(dto: CreateFlowerDto) {
    return this.prisma.flower.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateFlowerDto) {
    const flower = await this.prisma.flower.findUnique({
      where: {
        id,
      },
    });

    if (!flower) {
      throw new NotFoundException('Fleur introuvable');
    }

    return this.prisma.flower.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: string) {
    const flower = await this.prisma.flower.findUnique({
      where: {
        id,
      },
    });

    if (!flower) {
      throw new NotFoundException('Fleur introuvable');
    }

    await this.prisma.flower.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Fleur supprimée avec succès.',
    };
  }
}