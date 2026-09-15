import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitTestimonialDto {
  @IsString() content: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() occasion?: string;
}