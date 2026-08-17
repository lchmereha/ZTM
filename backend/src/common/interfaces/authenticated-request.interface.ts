import { Request } from 'express';
import { UsuarioRole } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: number;
  username: string;
  regra: UsuarioRole;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
