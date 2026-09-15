import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'selsabil@gmail.com',
    description: 'Adresse email de l’utilisateur',
  })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Mot de passe contenant minimum 8 caractères',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  password: string;

  @ApiProperty({
    example: 'Selsabil',
    description: 'Prénom de l’utilisateur',
  })
  @IsString({ message: 'Le prénom est requis.' })
  firstName: string;

  @ApiProperty({
    example: 'Amairi',
    description: 'Nom de famille de l’utilisateur',
  })
  @IsString({ message: 'Le nom est requis.' })
  lastName: string;

  @ApiPropertyOptional({
    example: '+21612345678',
    description: 'Numéro de téléphone optionnel',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}