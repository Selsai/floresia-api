// Rôle : Validation des données reçues par l’API.
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: 'id-commande-exemple',
    description: 'Identifiant réel de votre commande en attente, à remplacer.',
  })
  @IsString()
  orderId: string;
}
