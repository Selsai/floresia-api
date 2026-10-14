import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartCommandDto } from './cart.dto';
import { CUSTOM_BOUQUET_PRODUCT_ID } from '../chatbot/catalog-replies';

type Item = Record<string, unknown> & { id: string; quantity: number };
const quantity = (value: unknown) => {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 100)
    throw new BadRequestException('Quantité du panier invalide.');
  return Number(value);
};
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}
  private async account(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        cart: true,
        cartVersion: true,
        cartOperationIds: true,
        deletionRequestedAt: true,
        accountErasedAt: true,
      },
    });
    if (!user || user.deletionRequestedAt || user.accountErasedAt)
      throw new UnauthorizedException('Compte indisponible.');
    return user;
  }
  async get(id: string) {
    const user = await this.account(id);
    return {
      items: Array.isArray(user.cart) ? user.cart : [],
      version: user.cartVersion,
    };
  }
  private async canonical(
    value: Record<string, unknown>,
    count: number,
  ): Promise<Item> {
    const id = value.id;
    if (typeof id !== 'string' || id.length > 100)
      throw new BadRequestException('Produit du panier invalide.');
    const qty = quantity(count);
    if (!id.startsWith('custom-')) {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product || product.id === CUSTOM_BOUQUET_PRODUCT_ID)
        throw new BadRequestException('Ce produit n’est plus disponible.');
      return {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        category: product.category,
        price: product.price,
        quantity: qty,
      };
    }
    const config = record(value.customConfig);
    const main: unknown[] = Array.isArray(config.selectedFlowers)
      ? config.selectedFlowers
      : [];
    const secondary: unknown[] = Array.isArray(config.secondaryFlowers)
      ? config.secondaryFlowers
      : [];
    if (!main.length || main.length > 100 || secondary.length > 2000)
      throw new BadRequestException('Composition du panier invalide.');
    const ids = [...main.map((item) => record(item).id), ...secondary];
    if (ids.some((id) => typeof id !== 'string'))
      throw new BadRequestException('Fleurs invalides.');
    const flowers = await this.prisma.flower.findMany({
      where: { id: { in: ids as string[] } },
    });
    let cents = 0,
      stems = 0;
    const selected = main.map((raw) => {
      const item = record(raw),
        flower = flowers.find((f) => f.id === item.id),
        count = Number(item.quantity);
      if (
        !flower ||
        flower.isSecondary ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 1000
      )
        throw new BadRequestException(
          'Une fleur de la composition est indisponible.',
        );
      cents += Math.round(flower.price * 100) * count;
      stems += count;
      return {
        id: flower.id,
        name: `${flower.name} ${flower.color}`,
        category: flower.name,
        image: flower.imageUrl,
        price: flower.price,
        stock: flower.stock,
        quantity: count,
      };
    });
    for (const id of secondary) {
      const flower = flowers.find((f) => f.id === id && f.isSecondary);
      if (!flower) throw new BadRequestException('Complément indisponible.');
      cents += Math.round(flower.price * 100);
      stems++;
    }
    const occasion =
      typeof config.occasion === 'string' ? config.occasion.slice(0, 50) : '';
    const occasionName =
      typeof config.occasionName === 'string'
        ? config.occasionName.slice(0, 100)
        : 'Personnalisé';
    return {
      id,
      quantity: qty,
      name: `Bouquet Personnalisé - ${occasionName}`,
      category: 'Personnalisé',
      image: selected[0].image,
      price: cents / 100,
      customConfig: {
        occasion,
        occasionName,
        selectedFlowers: selected,
        secondaryFlowers: secondary,
        ribbonColor:
          typeof config.ribbonColor === 'string'
            ? config.ribbonColor.slice(0, 50)
            : '',
        message:
          typeof config.message === 'string'
            ? config.message.slice(0, 150)
            : '',
        totalStems: stems,
      },
    };
  }
  async mutate(id: string, command: CartCommandDto) {
    if (['remove', 'quantity'].includes(command.operation) && !command.id)
      throw new BadRequestException('Identifiant du produit manquant.');
    if (command.operation === 'quantity' && command.quantity === undefined)
      throw new BadRequestException('Quantité manquante.');
    const prepared: Item[] = [];
    if (command.operation === 'add')
      prepared.push(
        await this.canonical(command.item ?? {}, command.quantity ?? 1),
      );
    if (command.operation === 'merge')
      for (const item of command.items ?? [])
        prepared.push(await this.canonical(item, Number(item.quantity)));
    for (let attempt = 0; attempt < 5; attempt++) {
      const user = await this.account(id);
      let items = (Array.isArray(user.cart)
        ? user.cart
        : []) as unknown as Item[];
      if (user.cartOperationIds.includes(command.commandId))
        return { items, version: user.cartVersion };
      if (command.operation === 'clear') items = [];
      if (command.operation === 'remove')
        items = items.filter((item) => item.id !== command.id);
      if (command.operation === 'quantity')
        items = items.flatMap((item) =>
          item.id !== command.id
            ? [item]
            : command.quantity === 0
              ? []
              : [{ ...item, quantity: quantity(command.quantity) }],
        );
      if (command.operation === 'settle')
        items = items.flatMap((item) => {
          const paid = (command.items ?? []).find((p) => p.id === item.id);
          const remaining =
            item.quantity - (paid ? quantity(paid.quantity) : 0);
          return remaining > 0 ? [{ ...item, quantity: remaining }] : [];
        });
      for (const item of prepared) {
        const previous = items.find((p) => p.id === item.id);
        const count = previous
          ? command.operation === 'merge'
            ? Math.max(previous.quantity, item.quantity)
            : Math.min(100, previous.quantity + item.quantity)
          : item.quantity;
        quantity(count);
        items = previous
          ? items.map((p) =>
              p.id === item.id ? { ...item, quantity: count } : p,
            )
          : [...items, item];
      }
      if (items.length > 50)
        throw new BadRequestException(
          'Le panier est limité à 50 articles différents.',
        );
      const result = await this.prisma.user.updateMany({
        where: {
          id,
          cartVersion: user.cartVersion,
          deletionRequestedAt: null,
          accountErasedAt: null,
        },
        data: {
          cart: items as Prisma.InputJsonValue,
          cartVersion: { increment: 1 },
          cartOperationIds: [
            ...user.cartOperationIds.slice(-99),
            command.commandId,
          ],
        },
      });
      if (result.count) return { items, version: user.cartVersion + 1 };
    }
    throw new ConflictException(
      'Votre panier a changé sur un autre appareil. Veuillez réessayer.',
    );
  }
}
