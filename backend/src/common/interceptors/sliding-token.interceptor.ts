import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable, tap } from 'rxjs';
import {
  ONE_DAY_MS,
  buildSessionCookieOptions,
  isSessionPastAbsoluteLimit,
  parseDurationToMs,
} from '../helpers/session.helper';

/**
 * Sliding Token Interceptor
 *
 * Implementa expiração deslizante do JWT. Quando um request chega com token
 * válido que já passou da metade da vida, um token novo é devolvido — como
 * cookie httpOnly atualizado (web) ou no header `X-Refreshed-Token`
 * (mobile/API). Usuário ativo não é deslogado no meio do turno.
 *
 * Exemplo com JWT_EXPIRES_IN=1d:
 *   - Token emitido às 08:00, expira às 08:00 do dia seguinte (24h)
 *   - Metade da vida: 20:00 do mesmo dia (12h)
 *   - Qualquer request depois das 20:00 devolve um token novo
 *   - Sem nenhum request por 24h, a sessão cai
 *
 * A renovação NÃO é ilimitada: `SESSION_ABSOLUTE_TTL` (default 30d) é o teto
 * nominal contado a partir do login original (`authTime`). Passado o teto a
 * renovação para, o token corrente expira sozinho e o usuário refaz login.
 * Sem esse teto, quem fizesse um request por dia ficaria logado para sempre —
 * e um token roubado valeria para sempre também.
 */
@Injectable()
export class SlidingTokenInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract token from cookie (web) or Authorization header (mobile/API)
    const cookieToken = request.cookies?.access_token;
    const authHeader = request.headers?.authorization;
    const headerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = cookieToken || headerToken;
    if (!token) {
      return next.handle();
    }

    const isCookieAuth = !!cookieToken;

    return next.handle().pipe(
      tap(() => {
        try {
          const decoded = this.jwtService.verify(token as string);
          if (!decoded?.iat || !decoded?.exp) return;

          const now = Math.floor(Date.now() / 1000);
          const totalLifetime = decoded.exp - decoded.iat;
          const elapsed = now - decoded.iat;

          // Renew only if past the halfway point
          if (elapsed <= totalLifetime / 2) return;

          // Passado o teto nominal, deixa o token corrente morrer de velho.
          if (isSessionPastAbsoluteLimit(decoded.authTime, this.config)) return;

          // `iat`/`exp` saem para o `sign()` reemitir; `authTime` fica no
          // payload de propósito, senão cada renovação zeraria o teto.
          const { iat, exp, ...payload } = decoded as Record<string, unknown>;
          void iat;
          void exp;
          const newToken = this.jwtService.sign(payload);

          if (isCookieAuth) {
            // SEC-06: Renew via cookie for web clients
            response.cookie('access_token', newToken, {
              ...buildSessionCookieOptions(this.config),
              maxAge: parseDurationToMs(
                this.config.get<string>('JWT_EXPIRES_IN', '1d'),
                ONE_DAY_MS,
              ),
            });
          } else {
            // Renew via header for mobile/API clients
            response.setHeader('X-Refreshed-Token', newToken);
          }
        } catch {
          // Token verify failed — skip silently, the guard will handle auth
        }
      }),
    );
  }
}
