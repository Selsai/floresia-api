// Rôle : Règles métier et accès aux données.
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateAddress(address: {
    purpose?: string;
    zipCode?: string;
    country?: string;
    phone?: string | null;
  }) {
    if (
      (address.purpose ?? 'DELIVERY') === 'DELIVERY' &&
      address.zipCode &&
      !/^(750(0[1-9]|1[0-9]|20)|75116)$/.test(address.zipCode)
    )
      throw new BadRequestException(
        'La livraison est limitée à Paris : 75001 à 75020 et 75116.',
      );
    if (
      (address.purpose ?? 'DELIVERY') === 'DELIVERY' &&
      !/^(?:(?:\+33|0)[1-9](?:[ .-]?\d{2}){4})$/.test(
        address.phone?.trim() || '',
      )
    )
      throw new BadRequestException(
        'Renseignez un téléphone français valide pour la livraison.',
      );
    if (
      address.country &&
      address.country.toLocaleLowerCase('fr-FR') !== 'france'
    )
      throw new BadRequestException(
        'L’adresse de facturation doit actuellement être située en France.',
      );
  }

  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    this.validateAddress(dto);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, purpose: dto.purpose ?? 'DELIVERY' },
        data: { isDefault: false },
      });
    }

    const existing =
      (await this.prisma.address.findMany({
        where: { userId },
        select: { label: true },
      })) ?? [];
    let number = 1;
    while (existing.some((a) => a.label === `Adresse ${number}`)) number++;
    const label = dto.label?.trim() || `Adresse ${number}`;
    return this.prisma.address.create({
      data: { ...dto, label, userId, country: dto.country ?? 'France' },
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) throw new NotFoundException('Adresse introuvable.');
    if (address.userId !== userId)
      throw new ForbiddenException('Accès refusé.');
    this.validateAddress({ ...address, ...dto });

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId,
          purpose: dto.purpose ?? address.purpose ?? 'DELIVERY',
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...dto,
        ...(dto.label !== undefined
          ? { label: dto.label.trim() || address.label }
          : {}),
      },
    });
  }

  async remove(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) throw new NotFoundException('Adresse introuvable.');
    if (address.userId !== userId)
      throw new ForbiddenException('Accès refusé.');

    try {
      await this.prisma.address.delete({ where: { id: addressId } });
      return { message: 'Adresse supprimée avec succès.' };
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String(err.code)
          : undefined;
      if (code === 'P2003' || code === 'P2014') {
        throw new BadRequestException(
          'Cette adresse est liée à une ou plusieurs commandes passées et ne peut pas être supprimée.',
        );
      }
      throw err;
    }
  }
}
