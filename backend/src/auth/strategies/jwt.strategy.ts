import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { isSessionPastAbsoluteLimit } from '../../common/helpers/session.helper';
import { JwtPayload } from '../../common/interfaces/authenticated-request.interface';
import { UsuarioRole } from '../../generated/prisma/client';

/**
 * Extrai o JWT de duas fontes (em ordem de prioridade):
 * 1. Cookie httpOnly `access_token` — usado pelo frontend web
 * 2. Header `Authorization: Bearer <token>` — fallback para app mobile (Flutter/ZWM) e Swagger
 */
function extractJwtFromCookieOrHeader(req: Request): string | null {
  // 1. Try httpOnly cookie first
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) return cookieToken;

  // 2. Fallback to Authorization header (mobile, Swagger)
  const headerExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
  return headerExtractor(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret)
      throw new Error(
        'JWT_SECRET is not set. Refusing to start with insecure defaults.',
      );
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: Record<string, unknown>): JwtPayload {
    // O teto nominal precisa valer aqui, e não apenas na renovação deslizante:
    // um token de `JWT_EXPIRES_IN` emitido pouco antes do teto continuaria
    // válido depois dele se a checagem existisse só no interceptor.
    if (isSessionPastAbsoluteLimit(payload.authTime, this.config)) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    return {
      sub: payload.sub as number,
      username: payload.username as string,
      regra: payload.regra as UsuarioRole,
      authTime: payload.authTime as number,
    };
  }
}
