// Rôle : Validation des données reçues par l’API.
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'utilisateur@example.com',
    description: 'Adresse email de l’utilisateur',
  })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({
    example: 'ExempleMotDePasse!12',
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
    example: 'Exemple',
    description: 'Prénom de l’utilisateur',
  })
  @IsString({ message: 'Le prénom est requis.' })
  firstName: string;

  @ApiProperty({
    example: 'Utilisateur',
    description: 'Nom de famille de l’utilisateur',
  })
  @IsString({ message: 'Le nom est requis.' })
  lastName: string;
}
