import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioRole } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UsuarioRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se nenhum @Roles foi definido, permite o acesso (autenticação já foi validada pelo JwtAuthGuard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.regra as UsuarioRole)) {
      throw new ForbiddenException('Acesso restrito a administradores');
    }

    return true;
  }
}
