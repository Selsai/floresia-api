import { ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'AncienMotDePasse!12' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'ExempleMotDePasse!12' })
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
  newPassword: string;

  @ApiProperty({ example: 'ExempleMotDePasse!12' })
  @IsString()
  confirmPassword: string;
}
