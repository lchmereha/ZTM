import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ApiKeyPayload {
  apiKeyId: number;
  idFilial: number;
  idEmpresa: number;
  idUsuario: number;
}

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey: ApiKeyPayload;
  user?: {
    sub: number;
    regra: string;
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException(
        'Header "x-api-key" é obrigatório para endpoints externos.',
      );
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { chave: apiKeyHeader },
      include: {
        filial: { select: { id: true, idEmpresa: true } },
        usuario: { select: { id: true, regra: true } },
      },
    });

    if (!apiKey) {
      throw new UnauthorizedException('API Key inválida ou inexistente.');
    }

    request.apiKey = {
      apiKeyId: apiKey.id,
      idFilial: apiKey.filial.id,
      idEmpresa: apiKey.filial.idEmpresa,
      idUsuario: apiKey.idUsuario,
    } satisfies ApiKeyPayload;

    request.user = {
      sub: apiKey.idUsuario,
      regra: apiKey.usuario.regra,
    };

    return true;
  }
}
