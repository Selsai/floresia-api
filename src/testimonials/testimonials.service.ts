// Rôle : Règles métier et accès aux données.
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { SubmitTestimonialDto } from './dto/submit-testimonial.dto';
import { createFlowerAlias } from '../common/flower-alias';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import type { Testimonial } from '@prisma/client';

function presentTestimonial(
  testimonial: Testimonial,
  viewer?: AuthenticatedUser,
) {
  const { authorId, ...content } = testimonial;
  return {
    ...content,
    authorId: testimonial.isAnonymous ? undefined : authorId,
    canDelete: Boolean(
      viewer && (viewer.userId === authorId || viewer.role === 'ADMIN'),
    ),
  };
}

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  async findAll(viewer?: AuthenticatedUser) {
    const testimonials = await this.prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return (testimonials || []).map((testimonial) =>
      presentTestimonial(testimonial, viewer),
    );
  }

  async findOnePublic(id: string, viewer?: AuthenticatedUser) {
    return presentTestimonial(await this.findOne(id), viewer);
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!testimonial) throw new NotFoundException('Témoignage introuvable');
    return testimonial;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    await this.findOne(id);
    return this.prisma.testimonial.update({ where: { id }, data: dto });
  }

  async submit(userId: string, dto: SubmitTestimonialDto) {
    // Associe l’avis au compte vérifié.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Veuillez vérifier votre adresse email avant de pouvoir laisser un avis.',
      );
    }

    const testimonial = await this.prisma.testimonial.create({
      data: {
        authorName: dto.isAnonymous
          ? createFlowerAlias()
          : `${user.firstName} ${user.lastName.charAt(0)}.`,
        content: dto.content,
        rating: dto.rating,
        occasion: dto.occasion,
        authorId: userId,
        ...(dto.isAnonymous ? { isAnonymous: true } : {}),
      },
    });
    return testimonial
      ? presentTestimonial(testimonial, { userId, role: 'USER', email: '' })
      : testimonial;
  }

  async remove(id: string, userId: string, role: string) {
    // Autorise l’auteur ou un administrateur.
    const testimonial = await this.findOne(id);

    if (role !== 'ADMIN' && testimonial.authorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre avis.',
      );
    }

    await this.prisma.testimonial.delete({ where: { id } });
    return { message: 'Témoignage supprimé avec succès.' };
  }
}
