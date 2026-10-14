// Rôle : Lecture et validation du jeton JWT.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    sessionVersion?: number;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        deletionRequestedAt: true,
        accountErasedAt: true,
        sessionVersion: true,
      },
    });
    if (
      !user ||
      user.deletionRequestedAt ||
      user.accountErasedAt ||
      (payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)
    )
      throw new UnauthorizedException(
        'Votre session est expirée. Veuillez vous reconnecter.',
      );
    return {
      userId: payload.sub,
      email: user.email,
      role: user.role,
    };
  }
}
