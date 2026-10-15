import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class AdminNotificationsService
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly logger = new Logger(AdminNotificationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    if (process.env.ADMIN_NOTIFICATION_EMAIL !== 'contact.floresia@gmail.com')
      return;
    const tick = () => {
      void this.flush().catch(() =>
        this.logger.warn(
          'Alertes administrateur : reprise au prochain passage.',
        ),
      );
    };
    tick();
    this.timer = setInterval(tick, 30_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async flush() {
    if (
      this.running ||
      process.env.ADMIN_NOTIFICATION_EMAIL !== 'contact.floresia@gmail.com'
    )
      return;
    this.running = true;
    try {
      // Une réservation atomique évite les envois simultanés entre instances.
      const events = await this.prisma.$queryRaw<
        {
          id: string;
          title: string;
          payload: Record<string, unknown>;
          attempts: number;
        }[]
      >`
        UPDATE "AdminNotification" SET "nextAttemptAt" = NOW() + INTERVAL '10 minutes', attempts = attempts + 1, "firstAttemptAt" = COALESCE("firstAttemptAt", NOW())
        WHERE id IN (SELECT id FROM "AdminNotification" WHERE "sentAt" IS NULL AND "nextAttemptAt" <= NOW() AND attempts < 10 AND ("firstAttemptAt" IS NULL OR "firstAttemptAt" > NOW() - INTERVAL '23 hours') ORDER BY "createdAt" LIMIT 10 FOR UPDATE SKIP LOCKED)
        RETURNING id, title, payload, attempts`;
      for (const event of events) {
        try {
          await this.mail.sendAdminNotification(
            event.id,
            event.title,
            event.payload,
          );
          await this.prisma.adminNotification.update({
            where: { id: event.id },
            data: { sentAt: new Date(), payload: {} },
          });
        } catch {
          this.logger.warn(
            event.attempts >= 10
              ? `Alerte ${event.id} : dix échecs, vérification du service email nécessaire.`
              : 'Alerte administrateur en attente de nouvelle tentative.',
          );
          // Dix essais dans la journée restent dans la fenêtre d’idempotence Resend.
        }
      }
      await this.prisma.adminNotification.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 30 * 86400000) } },
      });
    } finally {
      this.running = false;
    }
  }
}
