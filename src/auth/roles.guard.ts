import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators';
import { AuthUser, Role } from './auth.types';

// Guard global kedua (jalan setelah JwtAuthGuard).
// Tanpa @Roles(...) request diloloskan; dengan @Roles(...) role user dicek.
// Hasil false otomatis menjadi 403 Forbidden.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();

    if (!user) throw new UnauthorizedException();

    return requiredRoles.includes(user.role);
  }
}
