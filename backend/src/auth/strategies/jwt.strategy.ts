import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
  constructor(config: ConfigService) {
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
    return {
      sub: payload.sub as number,
      username: payload.username as string,
      regra: payload.regra as UsuarioRole,
    };
  }
}
