import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { CookieOptions } from 'express';
import { lastValueFrom, of } from 'rxjs';
import { SlidingTokenInterceptor } from './sliding-token.interceptor';

/** Forma do payload que este projeto assina — `jwt.verify()` é genérico. */
interface SessionToken {
  sub: number;
  username: string;
  regra: string;
  authTime: number;
  iat: number;
  exp: number;
}

const SECRET = 'segredo-de-teste';
const LOGIN_AT = new Date('2026-01-01T08:00:00.000Z');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type Env = Record<string, string>;

/**
 * Constrói o interceptor com um JwtService real — assinar e verificar de
 * verdade é o que dá confiança de que `authTime` sobrevive à renovação.
 */
async function buildInterceptor(env: Env = {}) {
  const defaults: Env = { JWT_EXPIRES_IN: '1d', JWT_SECRET: SECRET };
  const values = { ...defaults, ...env };

  const moduleRef = await Test.createTestingModule({
    imports: [
      JwtModule.register({
        secret: SECRET,
        signOptions: { expiresIn: values.JWT_EXPIRES_IN },
      }),
    ],
    providers: [
      SlidingTokenInterceptor,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, fallback?: string) => values[key] ?? fallback,
        },
      },
    ],
  }).compile();

  return {
    interceptor: moduleRef.get(SlidingTokenInterceptor),
    jwt: moduleRef.get(JwtService),
  };
}

function fakeResponse() {
  return {
    // Generics de `@types/jest` são <Retorno, Argumentos>: tipar os argumentos
    // é o que faz `mock.calls[0][1]` ser `string` em vez de `any`.
    cookie: jest.fn<void, [string, string, CookieOptions]>(),
    setHeader: jest.fn<void, [string, string]>(),
  };
}

function fakeContext(request: unknown, response: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

/** Executa o interceptor e aguarda o pipe — a renovação acontece no `tap`. */
async function run(
  interceptor: SlidingTokenInterceptor,
  request: unknown,
  response: unknown,
) {
  const observable = interceptor.intercept(fakeContext(request, response), {
    handle: () => of({ ok: true }),
  });

  await lastValueFrom(observable);
}

const asCookie = (token: string) => ({
  cookies: { access_token: token },
  headers: {},
});

const asBearer = (token: string) => ({
  cookies: {},
  headers: { authorization: `Bearer ${token}` },
});

describe('SlidingTokenInterceptor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(LOGIN_AT);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const authTimeAtLogin = () => Math.floor(LOGIN_AT.getTime() / 1000);

  const login = (jwt: JwtService, authTime = authTimeAtLogin()) =>
    jwt.sign({ sub: 1, username: 'ZZADMIN', regra: 'ADMIN', authTime });

  describe('renovação deslizante', () => {
    it('não renova antes da metade da vida do token', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const token = login(jwt);
      const response = fakeResponse();

      jest.setSystemTime(LOGIN_AT.getTime() + 11 * HOUR_MS);
      await run(interceptor, asCookie(token), response);

      expect(response.cookie).not.toHaveBeenCalled();
      expect(response.setHeader).not.toHaveBeenCalled();
    });

    it('renova depois da metade da vida do token', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const token = login(jwt);
      const response = fakeResponse();

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(token), response);

      expect(response.cookie).toHaveBeenCalledTimes(1);
      const [name, newToken] = response.cookie.mock.calls[0];
      expect(name).toBe('access_token');
      expect(newToken).not.toBe(token);
    });

    it('devolve o token novo em X-Refreshed-Token quando a auth é por Bearer', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const token = login(jwt);
      const response = fakeResponse();

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asBearer(token), response);

      expect(response.cookie).not.toHaveBeenCalled();
      expect(response.setHeader).toHaveBeenCalledWith(
        'X-Refreshed-Token',
        expect.any(String),
      );
    });

    it('o token renovado estende a expiração e mantém a identidade', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const token = login(jwt);
      const response = fakeResponse();
      const original = jwt.verify<SessionToken>(token);

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(token), response);

      const renewed = jwt.verify<SessionToken>(
        response.cookie.mock.calls[0][1],
      );
      expect(renewed.exp).toBeGreaterThan(original.exp);
      expect(renewed.sub).toBe(original.sub);
      expect(renewed.username).toBe(original.username);
      expect(renewed.regra).toBe(original.regra);
    });

    it('não renova token expirado nem token de outro segredo', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const validToken = login(jwt);
      const foreignToken = new JwtService({
        secret: 'outro-segredo',
        signOptions: { expiresIn: '1d' },
      }).sign({ sub: 1, authTime: authTimeAtLogin() });

      const expiredResponse = fakeResponse();
      jest.setSystemTime(LOGIN_AT.getTime() + 2 * DAY_MS);
      await run(interceptor, asCookie(validToken), expiredResponse);
      expect(expiredResponse.cookie).not.toHaveBeenCalled();

      const foreignResponse = fakeResponse();
      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(foreignToken), foreignResponse);
      expect(foreignResponse.cookie).not.toHaveBeenCalled();
    });

    it('não faz nada quando não há token na request', async () => {
      const { interceptor } = await buildInterceptor();
      const response = fakeResponse();

      await run(interceptor, { cookies: {}, headers: {} }, response);

      expect(response.cookie).not.toHaveBeenCalled();
      expect(response.setHeader).not.toHaveBeenCalled();
    });
  });

  describe('teto nominal (SESSION_ABSOLUTE_TTL)', () => {
    it('preserva authTime através de renovações sucessivas', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      let token = login(jwt);
      const authTime = authTimeAtLogin();

      // 20 renovações a cada 13h cobrem ~11 dias: sem preservar authTime, o
      // teto seria empurrado a cada renovação e nunca chegaria.
      for (let i = 1; i <= 20; i++) {
        const response = fakeResponse();
        jest.setSystemTime(LOGIN_AT.getTime() + i * 13 * HOUR_MS);
        await run(interceptor, asCookie(token), response);

        expect(response.cookie).toHaveBeenCalledTimes(1);
        token = response.cookie.mock.calls[0][1];
        expect(jwt.verify<SessionToken>(token).authTime).toBe(authTime);
      }
    });

    it('para de renovar depois de 30 dias de sessão, mesmo com uso contínuo', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      let token = login(jwt);
      let renewals = 0;
      let lastRenewalAt = LOGIN_AT.getTime();

      // Usuário ativo: um request a cada 13h por 40 dias.
      for (let hours = 13; hours <= 40 * 24; hours += 13) {
        const response = fakeResponse();
        const now = LOGIN_AT.getTime() + hours * HOUR_MS;
        jest.setSystemTime(now);
        await run(interceptor, asCookie(token), response);

        if (response.cookie.mock.calls.length > 0) {
          token = response.cookie.mock.calls[0][1];
          renewals++;
          lastRenewalAt = now;
        }
      }

      expect(renewals).toBeGreaterThan(0);
      // A última renovação tem de cair dentro dos 30 dias, não depois.
      expect(lastRenewalAt - LOGIN_AT.getTime()).toBeLessThanOrEqual(
        30 * DAY_MS,
      );
      // E o token que sobrou não pode continuar válido indefinidamente.
      jest.setSystemTime(LOGIN_AT.getTime() + 40 * DAY_MS + DAY_MS);
      expect(() => jwt.verify(token)).toThrow();
    });

    it('respeita um teto customizado por SESSION_ABSOLUTE_TTL', async () => {
      const { interceptor, jwt } = await buildInterceptor({
        SESSION_ABSOLUTE_TTL: '2d',
      });
      const token = login(jwt);

      const inside = fakeResponse();
      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(token), inside);
      expect(inside.cookie).toHaveBeenCalledTimes(1);

      const renewed = inside.cookie.mock.calls[0][1];
      const outside = fakeResponse();
      jest.setSystemTime(LOGIN_AT.getTime() + 2 * DAY_MS + HOUR_MS);
      await run(interceptor, asCookie(renewed), outside);
      expect(outside.cookie).not.toHaveBeenCalled();
    });

    it('não renova token legado, sem authTime', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const legacyToken = jwt.sign({
        sub: 1,
        username: 'ZZADMIN',
        regra: 'ADMIN',
      });
      const response = fakeResponse();

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(legacyToken), response);

      expect(response.cookie).not.toHaveBeenCalled();
      expect(response.setHeader).not.toHaveBeenCalled();
    });

    it('não renova quando authTime vem corrompido', async () => {
      const { interceptor, jwt } = await buildInterceptor();
      const response = fakeResponse();
      const token = jwt.sign({
        sub: 1,
        username: 'ZZADMIN',
        regra: 'ADMIN',
        authTime: 'ontem',
      });

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(token), response);

      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('atributos do cookie renovado', () => {
    it('repete os atributos do cookie de login em topologia same-site', async () => {
      const { interceptor, jwt } = await buildInterceptor({
        COOKIE_SECURE: 'true',
        COOKIE_SAMESITE: 'lax',
      });
      const token = login(jwt);
      const response = fakeResponse();

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(token), response);

      expect(response.cookie.mock.calls[0][2]).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: DAY_MS,
      });
    });

    it('usa sameSite=none com secure quando app e API estão em domínios distintos', async () => {
      const { interceptor, jwt } = await buildInterceptor({
        COOKIE_SAMESITE: 'none',
      });
      const token = login(jwt);
      const response = fakeResponse();

      jest.setSystemTime(LOGIN_AT.getTime() + 13 * HOUR_MS);
      await run(interceptor, asCookie(token), response);

      const options = response.cookie.mock.calls[0][2];
      expect(options.sameSite).toBe('none');
      // SameSite=None sem Secure é descartado pelo browser: a sessão cairia na
      // primeira renovação da topologia AWS.
      expect(options.secure).toBe(true);
    });
  });
});
