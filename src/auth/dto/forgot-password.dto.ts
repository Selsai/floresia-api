import { ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'utilisateur@example.com' })
  @IsEmail()
  email: string;
}
