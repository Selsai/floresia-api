import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // Toutes les commandes
  // ==========================

  findAll() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================
  // Une commande
  // ==========================

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  // ==========================
  // Créer une commande
  // ==========================

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        totalAmount: dto.totalAmount,

        user: {
          connect: {
            id: userId,
          },
        },

        address: {
          connect: {
            id: dto.addressId,
          },
        },

        items: {
          create: dto.items.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            customNote: item.customNote,

            product: {
              connect: {
                id: item.productId,
              },
            },
          })),
        },
      },

      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  // ==========================
  // Modifier une commande
  // ==========================

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return this.prisma.order.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
    });
  }

  // ==========================
  // Supprimer une commande
  // ==========================

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    await this.prisma.order.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Commande supprimée avec succès.',
    };
  }
}