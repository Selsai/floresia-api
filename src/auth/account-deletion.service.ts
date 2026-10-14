import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import { resolve, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const digest = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AccountDeletionService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private readonly logger = new Logger(AccountDeletionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    void this.expireAccounts().catch(() =>
      this.logger.warn('Nettoyage des comptes à réessayer.'),
    );
    this.timer = setInterval(
      () => {
        void this.expireAccounts().catch(() =>
          this.logger.warn('Nettoyage des comptes à réessayer.'),
        );
      },
      60 * 60 * 1000,
    );
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async requestDeletion(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      user.deletionRequestedAt ||
      user.accountErasedAt ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException(
        'Le mot de passe est incorrect ou le compte est indisponible.',
      );
    }
    if (user.role === 'ADMIN')
      throw new BadRequestException(
        'Contactez le support pour supprimer un compte administrateur.',
      );
    const token = randomBytes(32).toString('hex');
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const link = `${(process.env.FRONTEND_URL || 'https://floresia.fr').replace(/\/$/, '')}/compte-suppression#token=${token}`;
    // Le compte reste utilisable si le prestataire refuse l’email de sécurité.
    await this.mail.sendAccountDeletion(
      user.email,
      user.firstName,
      link,
      deadline,
    );
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        deletionRequestedAt: null,
        accountErasedAt: null,
        sessionVersion: user.sessionVersion,
        email: user.email,
        passwordHash: user.passwordHash,
      },
      data: {
        deletionRequestedAt: new Date(),
        deletionDeadline: deadline,
        deletionTokenHash: digest(token),
        sessionVersion: { increment: 1 },
        resetToken: null,
        resetTokenExpires: null,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });
    if (result.count !== 1)
      throw new BadRequestException('Le compte a changé. Veuillez réessayer.');
    return {
      message:
        'Votre compte est désactivé. Un email vous permet de télécharger vos factures ou de réactiver le compte pendant 30 jours.',
      deadline,
    };
  }

  async verifyAccess(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new BadRequestException('Lien invalide ou expiré.');
    const user = await this.prisma.user.findFirst({
      where: {
        deletionTokenHash: digest(token),
        deletionRequestedAt: { not: null },
        deletionDeadline: { gt: new Date() },
        accountErasedAt: null,
      },
    });
    if (!user) throw new BadRequestException('Lien invalide ou expiré.');
    return user;
  }

  async access(token: string) {
    const user = await this.verifyAccess(token);
    const orders = await this.prisma.order.findMany({
      where: {
        userId: user.id,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      select: { id: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { deadline: user.deletionDeadline, orders };
  }

  async restore(token: string, password: string) {
    const user = await this.verifyAccess(token);
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        deletionTokenHash: digest(token),
        deletionDeadline: { gt: new Date() },
        accountErasedAt: null,
      },
      data: {
        passwordHash,
        deletionRequestedAt: null,
        deletionDeadline: null,
        deletionTokenHash: null,
        sessionVersion: { increment: 1 },
        resetToken: null,
        resetTokenExpires: null,
      },
    });
    if (result.count !== 1)
      throw new BadRequestException('Lien invalide ou expiré.');
    return {
      message:
        'Votre compte est réactivé et votre mot de passe a été remplacé. Vous pouvez vous reconnecter.',
    };
  }

  async expireAccounts() {
    const expired = await this.prisma.user.findMany({
      where: { deletionDeadline: { lte: new Date() }, accountErasedAt: null },
      select: { id: true },
      take: 25,
    });
    for (const { id } of expired) {
      await this.prisma.$transaction(async (tx) => {
        const result = await tx.user.updateMany({
          where: {
            id,
            deletionDeadline: { lte: new Date() },
            accountErasedAt: null,
          },
          data: {
            email: `deleted-${id}@example.invalid`,
            firstName: 'Compte',
            lastName: 'supprimé',
            phone: null,
            passwordHash: randomBytes(48).toString('hex'),
            isEmailVerified: false,
            deletionTokenHash: null,
            resetToken: null,
            resetTokenExpires: null,
            verificationCode: null,
            verificationCodeExpires: null,
            accountErasedAt: new Date(),
            sessionVersion: { increment: 1 },
          },
        });
        if (!result.count) return;
        const [comments, photos] = await Promise.all([
          tx.comment.findMany({
            where: { authorId: id },
            select: { imageUrl: true },
          }),
          tx.galleryPhoto.findMany({
            where: { authorId: id },
            select: { imageUrl: true },
          }),
        ]);
        const urls = [
          ...new Set(
            [...comments, ...photos].flatMap((item) =>
              item.imageUrl?.startsWith('/uploads/') ? [item.imageUrl] : [],
            ),
          ),
        ];
        await tx.user.update({
          where: { id },
          data: { pendingMediaDeletion: urls },
        });
        await tx.favorite.deleteMany({ where: { userId: id } });
        await tx.comment.deleteMany({ where: { authorId: id } });
        await tx.testimonial.deleteMany({ where: { authorId: id } });
        await tx.galleryPhoto.deleteMany({ where: { authorId: id } });
        await tx.article.updateMany({
          where: { authorId: id },
          data: {
            displayAuthorName: 'Compte supprimé',
            displayAuthorBio: null,
          },
        });
        await tx.comment.updateMany({
          where: { taggedUserId: id },
          data: { taggedUserId: null },
        });
        await tx.address.deleteMany({
          where: { userId: id, orders: { none: {} } },
        });
        // Les références et adresses rattachées aux commandes sont conservées séparément du profil.
      });
    }
    const pending = await this.prisma.user.findMany({
      where: {
        accountErasedAt: { not: null },
        pendingMediaDeletion: { isEmpty: false },
      },
      select: { id: true, pendingMediaDeletion: true },
      take: 25,
    });
    const uploads = resolve(process.cwd(), 'uploads');
    for (const user of pending) {
      const remaining: string[] = [];
      for (const url of user.pendingMediaDeletion) {
        if (
          !/^\/uploads\/(gallery|comments)\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/i.test(
            url,
          )
        ) {
          remaining.push(url);
          continue;
        }
        const path = resolve(uploads, url.slice('/uploads/'.length));
        if (!path.startsWith(uploads + sep)) {
          remaining.push(url);
          continue;
        }
        try {
          await unlink(path);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
            remaining.push(url);
        }
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { pendingMediaDeletion: remaining },
      });
    }
  }
}
