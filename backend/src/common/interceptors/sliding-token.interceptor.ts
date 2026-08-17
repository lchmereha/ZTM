import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable, tap } from 'rxjs';

/**
 * Sliding Token Interceptor
 *
 * Implements "sliding expiration" for JWT tokens. When a request arrives with
 * a valid token that has passed the halfway point of its lifetime, a fresh
 * token is generated and returned — either as an updated httpOnly cookie
 * (for web clients) or in the `X-Refreshed-Token` header (for mobile/API).
 *
 * This ensures that active users never get logged out unexpectedly — the token
 * only truly expires after a period of complete inactivity.
 *
 * Example with JWT_EXPIRES_IN=1d:
 *   - Token issued at 08:00, expires at 08:00 next day (24h)
 *   - Halfway point: 20:00 same day (12h)
 *   - Any request after 20:00 will return a fresh token
 *   - If user doesn't make any request for 24h, they're logged out
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
          if (elapsed > totalLifetime / 2) {
            const { iat, exp, ...payload } = decoded as Record<string, unknown>;
            void iat;
            void exp; // stripped from payload intentionally
            const newToken = this.jwtService.sign(payload);

            if (isCookieAuth) {
              // SEC-06: Renew via cookie for web clients
              response.cookie('access_token', newToken, {
                httpOnly: true,
                secure:
                  this.config.get<string>('COOKIE_SECURE', 'false') === 'true',
                sameSite: 'lax',
                path: '/',
                maxAge: this.parseTtlToMs(
                  this.config.get<string>('JWT_EXPIRES_IN', '1d'),
                ),
              });
            } else {
              // Renew via header for mobile/API clients
              response.setHeader('X-Refreshed-Token', newToken);
            }
          }
        } catch {
          // Token verify failed — skip silently, the guard will handle auth
        }
      }),
    );
  }

  private parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 86400000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 86400000);
  }
}
