// Rôle : Routes HTTP de ce domaine métier.
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { SubmitTestimonialDto } from './dto/submit-testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('mine')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitTestimonialDto,
  ) {
    return this.testimonialsService.submit(user.userId, dto);
  }

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@CurrentUser() user?: AuthenticatedUser) {
    return this.testimonialsService.findAll(user);
  }

  @Get(':id')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.testimonialsService.findOnePublic(id, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testimonialsService.remove(id, user.userId, user.role);
  }
}
