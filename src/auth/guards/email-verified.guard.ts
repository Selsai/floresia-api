import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.isEmailVerified) {
      throw new ForbiddenException(
        'Veuillez vérifier votre adresse email avant de continuer.',
      );
    }

    return true;
  }
}