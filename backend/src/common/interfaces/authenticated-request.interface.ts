import { Request } from 'express';
import { UsuarioRole } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: number;
  username: string;
  regra: UsuarioRole;
  /**
   * Epoch em segundos do login original. Sobrevive às renovações deslizantes
   * (ao contrário de `iat`, que é reemitido a cada renovação) e é o que ancora
   * o teto nominal de `SESSION_ABSOLUTE_TTL`.
   */
  authTime: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
