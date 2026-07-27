import { Module } from '@nestjs/common';

import { FlowersController } from './flowers.controller';
import { FlowersService } from './flowers.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FlowersController],
  providers: [FlowersService],
})
export class FlowersModule {}