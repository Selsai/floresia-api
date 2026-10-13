import { ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Exemple' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Utilisateur' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'utilisateur@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email?: string;
}
