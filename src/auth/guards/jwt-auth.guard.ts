import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

function errorMessage(info: unknown): string {
  if (typeof info === 'object' && info !== null && 'message' in info) {
    return String(info.message);
  }
  return 'Token JWT invalide ou manquant.';
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false | null,
    info: unknown,
  ): TUser {
    if (err || !user) {
      if (err instanceof Error) throw err;
      throw new UnauthorizedException(errorMessage(info));
    }

    return user;
  }
}
