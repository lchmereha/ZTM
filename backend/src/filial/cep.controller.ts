import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';

interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Controller('cep')
export class CepController {
  private readonly cepBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.cepBaseUrl = this.config.get<string>(
      'CEP_API_URL',
      'https://viacep.com.br/ws',
    );
  }

  @Get(':cep')
  @Public()
  async lookup(@Param('cep') cep: string): Promise<CepResponse> {
    const sanitized = cep.replace(/\D/g, '');
    if (sanitized.length !== 8) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'CEP deve conter exatamente 8 dígitos.',
      });
    }

    try {
      const response = await fetch(`${this.cepBaseUrl}/${sanitized}/json/`);
      const data: CepResponse = await response.json();
      return data;
    } catch {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message:
          'Não foi possível consultar o serviço de CEP. Tente novamente em instantes.',
      });
    }
  }
}
