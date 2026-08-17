import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

const NOW = new Date('2026-01-01T08:00:00.000Z');
const nowInSeconds = () => Math.floor(NOW.getTime() / 1000);
const DAY_SECONDS = 24 * 60 * 60;

const buildStrategy = (values: Record<string, string> = {}) =>
  new JwtStrategy({
    get: (key: string, fallback?: string) =>
      ({ JWT_SECRET: 'segredo-de-teste', ...values })[key] ?? fallback,
  } as unknown as ConfigService);

const payloadWith = (authTime: unknown) => ({
  sub: 1,
  username: 'ZZADMIN',
  regra: 'ADMIN',
  authTime,
});

describe('JwtStrategy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('recusa subir sem JWT_SECRET, em vez de assumir um default inseguro', () => {
    expect(
      () =>
        new JwtStrategy({
          get: () => undefined,
        } as unknown as ConfigService),
    ).toThrow(/JWT_SECRET is not set/);
  });

  it('aceita sessão dentro do teto e devolve a identidade', () => {
    const authTime = nowInSeconds() - 10 * DAY_SECONDS;

    expect(buildStrategy().validate(payloadWith(authTime))).toEqual({
      sub: 1,
      username: 'ZZADMIN',
      regra: 'ADMIN',
      authTime,
    });
  });

  it('rejeita sessão que passou do teto nominal', () => {
    const authTime = nowInSeconds() - 31 * DAY_SECONDS;

    expect(() => buildStrategy().validate(payloadWith(authTime))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita token legado, sem authTime — logout único no deploy', () => {
    expect(() =>
      buildStrategy().validate({ sub: 1, username: 'ZZADMIN', regra: 'ADMIN' }),
    ).toThrow(UnauthorizedException);
  });

  it('respeita SESSION_ABSOLUTE_TTL customizado', () => {
    const authTime = nowInSeconds() - 3 * DAY_SECONDS;
    const strategy = buildStrategy({ SESSION_ABSOLUTE_TTL: '2d' });

    expect(() => strategy.validate(payloadWith(authTime))).toThrow(
      UnauthorizedException,
    );
  });

  it('o teto vale na validação, não só na renovação', () => {
    // Cenário que o teto só no interceptor deixaria passar: token emitido
    // dentro dos 30 dias, mas apresentado depois deles.
    const authTime = nowInSeconds() - 30 * DAY_SECONDS - 60;

    expect(() => buildStrategy().validate(payloadWith(authTime))).toThrow(
      UnauthorizedException,
    );
  });
});
