import { ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'utilisateur@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
