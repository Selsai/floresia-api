// Rôle : Validation des données reçues par l’API.
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'utilisateur@example.com',
    description: 'Email du compte utilisateur',
  })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({
    example: 'ExempleMotDePasse!12',
    description: 'Mot de passe utilisateur',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password: string;
}
