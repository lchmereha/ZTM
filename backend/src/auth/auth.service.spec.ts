import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { isSessionPastAbsoluteLimit } from '../common/helpers/session.helper';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

const NOW = new Date('2026-01-01T08:00:00.000Z');
const SENHA = 'ZZ@1020';

const adminUser = {
  id: 1,
  nome: 'Administrador',
  usuario: 'ZZADMIN',
  email: 'admin@exemplo.com.br',
  senha: bcrypt.hashSync(SENHA, 4),
  regra: 'ADMIN',
  ativo: true,
  filiaisPermitidas: [],
  permissoesUsuario: [],
};

async function buildService(user: unknown = adminUser) {
  const sign = jest.fn<string, [Record<string, unknown>]>(() => 'token');

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: PrismaService,
        useValue: {
          usuario: { findUnique: jest.fn().mockResolvedValue(user) },
          empresa: { findMany: jest.fn().mockResolvedValue([]) },
          filial: { findMany: jest.fn().mockResolvedValue([]) },
        },
      },
      { provide: JwtService, useValue: { sign } },
    ],
  }).compile();

  return { service: moduleRef.get(AuthService), sign };
}

const loginDto = { usuario: 'ZZADMIN', senha: SENHA } as LoginDto;

describe('AuthService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', async () => {
    const { service } = await buildService();

    expect(service).toBeDefined();
  });

  it('assina o token com authTime no instante do login', async () => {
    const { service, sign } = await buildService();

    await service.login(loginDto);

    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign.mock.calls[0][0]).toMatchObject({
      sub: 1,
      username: 'ZZADMIN',
      regra: 'ADMIN',
      authTime: Math.floor(NOW.getTime() / 1000),
    });
  });

  it('o authTime emitido no login não nasce fora do teto nominal', async () => {
    // Guarda contra o modo de falha mais caro do teto: `authTime` ausente ou em
    // unidade errada (ms em vez de segundos) trancaria TODOS os usuários fora
    // no primeiro request, porque token sem authTime válido é tratado como
    // expirado de propósito.
    const { service, sign } = await buildService();

    await service.login(loginDto);
    const { authTime } = sign.mock.calls[0][0];

    expect(
      isSessionPastAbsoluteLimit(authTime, {
        get: (_key: string, fallback?: string) => fallback,
      } as never),
    ).toBe(false);
  });

  it('rejeita senha errada sem assinar token', async () => {
    const { service, sign } = await buildService();

    await expect(
      service.login({ ...loginDto, senha: 'errada' } as LoginDto),
    ).rejects.toThrow(UnauthorizedException);
    expect(sign).not.toHaveBeenCalled();
  });

  it('rejeita usuário inativo', async () => {
    const { service } = await buildService({ ...adminUser, ativo: false });

    await expect(service.login(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita usuário inexistente', async () => {
    const { service } = await buildService(null);

    await expect(service.login(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
