import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    console.log('JWT GUARD ERROR =>', err);
    console.log('JWT GUARD USER =>', user);
    console.log('JWT GUARD INFO =>', info);

    if (err || !user) {
      throw err || new UnauthorizedException(
        info?.message || 'Token JWT invalide ou manquant.',
      );
    }

    return user;
  }
}