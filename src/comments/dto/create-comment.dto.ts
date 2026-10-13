import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Exemple de texte à adapter.' })
  @IsString()
  content: string;
  @ApiProperty({
    example: 'id-article-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsString()
  articleId: string;
  @ApiPropertyOptional({
    example: 'id-commentaire-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
  @ApiPropertyOptional({
    example: 'id-utilisateur-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsOptional()
  @IsString()
  taggedUserId?: string;
}
