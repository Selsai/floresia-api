import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateTestimonialDto {
  @IsString() authorName: string;
  @IsString() content: string;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() occasion?: string;
}