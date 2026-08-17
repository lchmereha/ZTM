import { ConfigService } from '@nestjs/config';
import {
  ONE_DAY_MS,
  THIRTY_DAYS_MS,
  buildSessionCookieOptions,
  isSessionPastAbsoluteLimit,
  parseDurationToMs,
  sessionAbsoluteDeadlineMs,
} from './session.helper';

const configWith = (values: Record<string, string>) =>
  ({
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  }) as unknown as ConfigService;

const NOW = new Date('2026-01-01T08:00:00.000Z');
const nowInSeconds = () => Math.floor(NOW.getTime() / 1000);

describe('parseDurationToMs', () => {
  it.each([
    ['30s', 30 * 1000],
    ['15m', 15 * 60 * 1000],
    ['12h', 12 * 60 * 60 * 1000],
    ['1d', ONE_DAY_MS],
    ['30d', THIRTY_DAYS_MS],
  ])('converte %s', (input, expected) => {
    expect(parseDurationToMs(input, ONE_DAY_MS)).toBe(expected);
  });

  it.each(['', '1', 'd', '1w', '1.5d', '-1d', '1 d', 'abc'])(
    'cai no fallback para o formato inválido %p',
    (input) => {
      expect(parseDurationToMs(input, 1234)).toBe(1234);
    },
  );
});

describe('buildSessionCookieOptions', () => {
  it('usa lax sem secure por padrão (rede local, HTTP)', () => {
    expect(buildSessionCookieOptions(configWith({}))).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('força secure quando sameSite é none, mesmo com COOKIE_SECURE=false', () => {
    const options = buildSessionCookieOptions(
      configWith({ COOKIE_SAMESITE: 'none', COOKIE_SECURE: 'false' }),
    );

    expect(options.sameSite).toBe('none');
    expect(options.secure).toBe(true);
  });

  it('aceita COOKIE_SAMESITE em maiúsculas', () => {
    expect(
      buildSessionCookieOptions(configWith({ COOKIE_SAMESITE: 'None' }))
        .sameSite,
    ).toBe('none');
  });
});

describe('sessionAbsoluteDeadlineMs', () => {
  it('soma o teto default de 30 dias ao instante do login', () => {
    const authTime = nowInSeconds();

    expect(sessionAbsoluteDeadlineMs(authTime, configWith({}))).toBe(
      authTime * 1000 + THIRTY_DAYS_MS,
    );
  });

  it('usa o teto configurado quando SESSION_ABSOLUTE_TTL está definida', () => {
    const authTime = nowInSeconds();

    expect(
      sessionAbsoluteDeadlineMs(
        authTime,
        configWith({ SESSION_ABSOLUTE_TTL: '7d' }),
      ),
    ).toBe(authTime * 1000 + 7 * ONE_DAY_MS);
  });

  it('cai em 30 dias — e não em 1 dia — quando o valor é inválido', () => {
    const authTime = nowInSeconds();

    expect(
      sessionAbsoluteDeadlineMs(
        authTime,
        configWith({ SESSION_ABSOLUTE_TTL: 'sempre' }),
      ),
    ).toBe(authTime * 1000 + THIRTY_DAYS_MS);
  });
});

describe('isSessionPastAbsoluteLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('aceita sessão dentro do teto', () => {
    const authTime = nowInSeconds() - 29 * 24 * 60 * 60;

    expect(isSessionPastAbsoluteLimit(authTime, configWith({}))).toBe(false);
  });

  it('rejeita sessão além do teto', () => {
    const authTime = nowInSeconds() - 31 * 24 * 60 * 60;

    expect(isSessionPastAbsoluteLimit(authTime, configWith({}))).toBe(true);
  });

  it('rejeita exatamente no instante do teto', () => {
    const authTime = nowInSeconds() - 30 * 24 * 60 * 60;

    expect(isSessionPastAbsoluteLimit(authTime, configWith({}))).toBe(true);
  });

  it.each([
    ['ausente', undefined],
    ['nulo', null],
    ['string', '1767254400'],
    ['NaN', NaN],
    ['Infinity', Infinity],
  ])('rejeita authTime %s (token legado ou corrompido)', (_label, authTime) => {
    expect(isSessionPastAbsoluteLimit(authTime, configWith({}))).toBe(true);
  });
});
