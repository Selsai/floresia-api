import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // Tous les utilisateurs
  // ==========================

  findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // ==========================
  // Un utilisateur
  // ==========================

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  // ==========================
  // Modifier le rôle
  // ==========================

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return this.prisma.user.update({
      where: {
        id,
      },

      data: {
        role: dto.role,
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

// ==========================
// Supprimer
// ==========================

async remove(id: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  try {
    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Utilisateur supprimé avec succès.',
    };
  } catch (error) {
        if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException(
        "Impossible de supprimer cet utilisateur car il possède encore des données associées (articles, commentaires ou commandes).",
      );
    }

    throw error;
  }
}
}