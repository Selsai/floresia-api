import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.testimonial.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial)
      throw new NotFoundException('Témoignage introuvable');

    return testimonial;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    await this.findOne(id);

    return this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.testimonial.delete({
      where: { id },
    });

    return {
      message: 'Témoignage supprimé avec succès.',
    };
  }
}