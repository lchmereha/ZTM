import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

const UNIT_MULTIPLIERS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: ONE_DAY_MS,
};

/**
 * Converte duração no formato aceito pelo JWT (`"30m"`, `"12h"`, `"1d"`) em
 * milissegundos.
 *
 * `fallbackMs` é usado quando a string não casa com o formato. Cada chamador
 * informa o seu porque o valor seguro depende do que a duração controla: para a
 * vida do token, um dia; para o teto absoluto, trinta dias. Um fallback único
 * transformaria `SESSION_ABSOLUTE_TTL` mal escrita em logout diário geral.
 */
export function parseDurationToMs(
  duration: string,
  fallbackMs: number,
): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return fallbackMs;

  return parseInt(match[1], 10) * UNIT_MULTIPLIERS[match[2]];
}

/**
 * Opções do cookie de sessão.
 *
 * `COOKIE_SAMESITE` precisa ser `none` quando o frontend e a API ficam em
 * domínios registráveis diferentes (ex.: app.exemplo.com.br chamando
 * api.outrodominio.com) — com `lax` o browser não envia o cookie em XHR
 * cross-site e a autenticação simplesmente não funciona. Subdomínios do mesmo
 * domínio continuam sendo same-site, e aí `lax` basta.
 *
 * `SameSite=None` só é aceito pelos browsers junto de `Secure`, então essa
 * combinação é forçada aqui em vez de depender de duas variáveis coerentes.
 *
 * Compartilhado entre o login e a renovação deslizante de propósito: o cookie
 * emitido na renovação precisa ter exatamente os mesmos atributos do emitido no
 * login, senão o browser trata como cookie diferente e a sessão cai.
 */
export function buildSessionCookieOptions(
  config: ConfigService,
): CookieOptions {
  const sameSite = config
    .get<string>('COOKIE_SAMESITE', 'lax')
    .toLowerCase() as CookieOptions['sameSite'];
  const secure =
    sameSite === 'none' ||
    config.get<string>('COOKIE_SECURE', 'false') === 'true';

  return { httpOnly: true, secure, sameSite, path: '/' };
}

/**
 * Teto nominal da sessão: o instante, em ms epoch, a partir do qual a sessão
 * morre por idade independentemente de quantas renovações deslizantes tenha
 * recebido.
 *
 * Sem esse teto a renovação deslizante é ilimitada — quem fizer um request a
 * cada `JWT_EXPIRES_IN` nunca desloga, e um token roubado vale para sempre nas
 * mãos de quem o mantiver ativo.
 */
export function sessionAbsoluteDeadlineMs(
  authTime: number,
  config: ConfigService,
): number {
  const ttlMs = parseDurationToMs(
    config.get<string>('SESSION_ABSOLUTE_TTL', '30d'),
    THIRTY_DAYS_MS,
  );

  return authTime * 1000 + ttlMs;
}

/**
 * Decide se a sessão já passou do teto nominal.
 *
 * `authTime` ausente ou não numérico conta como expirada: são tokens emitidos
 * antes deste recurso existir, e aceitá-los sem teto reabriria exatamente a
 * brecha que o teto fecha. O efeito é um logout único no deploy — a partir do
 * primeiro login novo, todo token carrega `authTime`.
 */
export function isSessionPastAbsoluteLimit(
  authTime: unknown,
  config: ConfigService,
): boolean {
  if (typeof authTime !== 'number' || !Number.isFinite(authTime)) return true;

  return Date.now() >= sessionAbsoluteDeadlineMs(authTime, config);
}
