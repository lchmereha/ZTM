import { SetMetadata } from '@nestjs/common';
import { UsuarioRole } from '../../generated/prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UsuarioRole[]) => SetMetadata(ROLES_KEY, roles);
