import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CUSTOM_BOUQUET_PRODUCT_ID } from '../chatbot/catalog-replies';
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
    // Valide le panier puis calcule le total officiel.
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });
    if (!address) throw new NotFoundException('Adresse introuvable');
    if (address.userId !== userId)
      throw new ForbiddenException('Cette adresse ne vous appartient pas.');

    const deliveryMethod = dto.deliveryMethod ?? 'DELIVERY';
    if (deliveryMethod === 'PICKUP' && !dto.pickupStoreId?.trim()) {
      throw new BadRequestException('Sélectionnez un point de retrait.');
    }
    if (!dto.items?.length)
      throw new BadRequestException('Le panier est vide.');

    const flowerIds = dto.items.flatMap(
      (item) => item.customBouquet?.flowers.map((f) => f.flowerId) ?? [],
    );
    const [products, flowers] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: dto.items.map((i) => i.productId) } },
      }),
      this.prisma.flower.findMany({ where: { id: { in: flowerIds } } }),
    ]);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const flowerMap = new Map(flowers.map((f) => [f.id, f]));
    const requestedStock = new Map<string, number>();

    // Les centimes évitent les erreurs d'arrondi lors des additions.
    const priceInCents = (price: number) => {
      const cents = Math.round(price * 100);
      if (!Number.isSafeInteger(cents) || cents <= 0) {
        throw new BadRequestException('Prix catalogue invalide.');
      }
      return cents;
    };

    const items = dto.items.map((item) => {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        throw new BadRequestException('Quantité de bouquet invalide.');
      }
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException('Un bouquet est introuvable.');
      let unitCents: number;
      let customNote = item.customNote;

      if (item.productId === CUSTOM_BOUQUET_PRODUCT_ID) {
        const config = item.customBouquet;
        if (!config?.flowers?.length) {
          throw new BadRequestException(
            'Recomposez votre bouquet personnalisé pour vérifier ses fleurs.',
          );
        }
        let hasMainFlower = false;
        unitCents = 0;
        const descriptions = config.flowers.map((selection) => {
          const flower = flowerMap.get(selection.flowerId);
          if (!flower)
            throw new BadRequestException('Une fleur est introuvable.');
          if (
            !Number.isInteger(selection.quantity) ||
            selection.quantity < 1 ||
            selection.quantity > 1000
          ) {
            throw new BadRequestException('Quantité de tiges invalide.');
          }
          hasMainFlower ||= !flower.isSecondary;
          unitCents += priceInCents(flower.price) * selection.quantity;
          requestedStock.set(
            flower.id,
            (requestedStock.get(flower.id) ?? 0) +
              selection.quantity * item.quantity,
          );
          const name =
            flower.name.toLocaleLowerCase('fr-FR') ===
            flower.color.toLocaleLowerCase('fr-FR')
              ? flower.name
              : flower.name + ' ' + flower.color;
          return selection.quantity + 'x ' + name;
        });
        if (!hasMainFlower)
          throw new BadRequestException(
            'Choisissez au moins une fleur principale.',
          );
        customNote =
          'Occasion: ' +
          (config.occasionName || '-') +
          ' | Fleurs: ' +
          descriptions.join(', ') +
          ' | Ruban: ' +
          (config.ribbonColor || '-') +
          (config.message ? ' | Message: ' + config.message : '');
      } else {
        if (item.customBouquet)
          throw new BadRequestException(
            'Ce produit ne correspond pas à une composition personnalisée.',
          );
        unitCents = priceInCents(product.price);
      }
      return {
        quantity: item.quantity,
        unitPrice: unitCents / 100,
        customNote,
        product: { connect: { id: item.productId } },
      };
    });

    // Vérifie le cumul des tiges, y compris les doublons entre compositions.
    for (const [flowerId, quantity] of requestedStock) {
      if (quantity > flowerMap.get(flowerId)!.stock) {
        throw new BadRequestException(
          'Stock insuffisant pour une fleur sélectionnée.',
        );
      }
    }

    const subtotalCents = items.reduce(
      (sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity,
      0,
    );
    const deliveryCents =
      deliveryMethod === 'PICKUP' || subtotalCents >= 5000 ? 0 : 590;

    return this.prisma.order.create({
      data: {
        totalAmount: (subtotalCents + deliveryCents) / 100,
        deliveryMethod,
        pickupStoreId:
          deliveryMethod === 'PICKUP' ? dto.pickupStoreId : undefined,
        user: { connect: { id: userId } },
        address: { connect: { id: address.id } },
        items: { create: items },
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
