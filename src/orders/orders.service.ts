import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // Commandes : toutes (ADMIN) ou les siennes (USER)
  // ==========================

  findAll(userId: string, role: string) {
    return this.prisma.order.findMany({
      where: role === 'ADMIN' ? {} : { userId },
      include: {
        user: { select: SAFE_USER_SELECT },
        address: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================
  // Une commande (avec vérification de propriété)
  // ==========================

  async findOne(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: SAFE_USER_SELECT },
        address: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette commande');
    }

    return order;
  }

  // ==========================
  // Créer une commande
  // ==========================

async create(userId: string, dto: CreateOrderDto) {
  return this.prisma.order.create({
    data: {
      totalAmount: dto.totalAmount,
      deliveryMethod: dto.deliveryMethod ?? 'DELIVERY',
      pickupStoreId: dto.pickupStoreId,
      user: { connect: { id: userId } },
      address: { connect: { id: dto.addressId } },
      items: {
        create: dto.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customNote: item.customNote,
          product: { connect: { id: item.productId } },
        })),
      },
    },
    include: {
      user: { select: SAFE_USER_SELECT },
      address: true,
      items: { include: { product: true } },
    },
  });
}

  // ==========================
  // Modifier une commande (ADMIN uniquement, via le guard du controller)
  // ==========================

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ==========================
  // Supprimer une commande (ADMIN uniquement, via le guard du controller)
  // ==========================

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    await this.prisma.order.delete({ where: { id } });

    return { message: 'Commande supprimée avec succès.' };
  }
}