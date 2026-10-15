import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    _err: unknown,
    user: TUser | false | null,
  ): TUser {
    // La lecture reste publique. Seul un JWT vérifié peut ouvrir les actions du propriétaire.
    return (_err ? undefined : user || undefined) as TUser;
  }
}
