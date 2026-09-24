import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return Boolean(request.user && requiredRoles.includes(request.user.role));
  }
}
