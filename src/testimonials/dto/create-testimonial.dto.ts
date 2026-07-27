import { IsOptional, IsString } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  authorName: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}