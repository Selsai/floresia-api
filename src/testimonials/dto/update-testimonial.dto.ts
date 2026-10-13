// Rôle : Validation des données reçues par l’API.
import { PartialType } from '@nestjs/swagger';
import { CreateTestimonialDto } from './create-testimonial.dto';

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}
