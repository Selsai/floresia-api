// Rôle : Validation des données reçues par l’API.
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'selsabil@gmail.com',
    description: 'Adresse email de l’utilisateur',
  })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({
    example: 'MotDePasse!12',
    description:
      'Mot de passe d’au moins 12 caractères avec une majuscule, un chiffre et un caractère spécial',
  })
  @IsString()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caractères.',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Le mot de passe doit contenir au moins une majuscule.',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins un chiffre.',
  })
  @Matches(/(?=.*[^A-Za-z0-9])/, {
    message: 'Le mot de passe doit contenir au moins un caractère spécial.',
  })
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
