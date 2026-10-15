// Rôle : Assemblage NestJS de ce domaine métier.
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminNotificationsService } from './admin-notifications.service';

@Module({
  imports: [PrismaModule],
  providers: [MailService, AdminNotificationsService],
  exports: [MailService],
})
export class MailModule {}
