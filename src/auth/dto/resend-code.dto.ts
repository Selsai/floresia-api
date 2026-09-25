// Rôle : Validation des données reçues par l’API.
import { IsEmail } from 'class-validator';

export class ResendCodeDto {
  @IsEmail()
  email: string;
}
