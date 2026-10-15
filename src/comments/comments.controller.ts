// Rôle : Routes HTTP de ce domaine métier.
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';

@ApiTags('Comments')
@ApiExtraModels(CreateCommentDto)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('article/:articleId')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(OptionalJwtAuthGuard)
  findByArticle(
    @Param('articleId') articleId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.commentsService.findByArticle(articleId, user);
  }

  @Get('article/:articleId/commenters')
  getCommenters(@Param('articleId') articleId: string) {
    return this.commentsService.getCommentersForArticle(articleId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  findAllForAdmin() {
    return this.commentsService.findAllForAdmin();
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateCommentDto) },
        {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              format: 'binary',
              description:
                'Image facultative en multipart : JPG, PNG ou WebP, jusqu’à 5 Mo.',
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/comments',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(
            new Error('Seules les images JPG, PNG ou WEBP sont acceptées.'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file ? `/uploads/comments/${file.filename}` : undefined;
    return this.commentsService.create(user.userId, dto, imageUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.remove(id, user.userId, user.role);
  }
}
