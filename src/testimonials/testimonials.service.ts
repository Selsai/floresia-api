import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { SubmitTestimonialDto } from './dto/submit-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  findAll() {
    return this.prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Veuillez vérifier votre adresse email avant de pouvoir laisser un avis.',
      );
    }

    return this.prisma.testimonial.create({
      data: {
        authorName: `${user.firstName} ${user.lastName.charAt(0)}.`,
        content: dto.content,
        rating: dto.rating,
        occasion: dto.occasion,
        authorId: userId,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
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
