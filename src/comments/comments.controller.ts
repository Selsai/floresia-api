import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // =========================
  // Tous les commentaires d'un article
  // GET /comments/article/:articleId
  // =========================

  @Get('article/:articleId')
  findByArticle(@Param('articleId') articleId: string) {
    return this.commentsService.findByArticle(articleId);
  }

  // =========================
  // Un commentaire par ID
  // GET /comments/:id
  // =========================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  // =========================
  // Créer un commentaire
  // POST /comments
  // =========================

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.sub, dto);
  }

  // =========================
  // Modifier un commentaire
  // PATCH /comments/:id
  // =========================

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, dto);
  }

  // =========================
  // Supprimer un commentaire
  // DELETE /comments/:id
  // =========================

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}