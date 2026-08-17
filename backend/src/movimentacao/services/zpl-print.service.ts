import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as net from 'net';
import { TenantService } from '../../common/services/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ZplPrintService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  /**
   * Validates that a movimentação belongs to the user's tenant.
   * Delegates to centralized TenantService.
   */
  private ensureMovimentacaoAccess(
    idMovimentacao: number,
    userId: number,
    regra: string,
  ) {
    return this.tenant.ensureMovimentacaoAccess(idMovimentacao, userId, regra);
  }

  // ── Imprimir Tags ──────────────────────────────────────

  async imprimirTags(
    idMovimentacao: number,
    userId: number,
    regra: string,
    clientSide = false,
  ) {
    await this.ensureMovimentacaoAccess(idMovimentacao, userId, regra);

    const movimentacao = await this.prisma.movimentacao.findUnique({
      where: { id: idMovimentacao },
      include: {
        equipamento: true,
        filial: { include: { etiquetaPadrao: true, empresa: true } },
        importacaoItens: true,
      },
    });

    if (!movimentacao)
      throw new NotFoundException('Movimentação não encontrada');

    if (
      movimentacao.situacao !== 'PROCESSADO' &&
      movimentacao.situacao !== 'FINALIZADO'
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Movimentação não está na situação PROCESSADO ou FINALIZADO (atual: ${movimentacao.situacao}).`,
      });
    }

    if (
      !movimentacao.equipamento ||
      !movimentacao.equipamento.ipConexao ||
      !movimentacao.equipamento.portaConexao
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Nenhum equipamento de impressão está vinculado a esta movimentação, ou o equipamento não possui IP/porta configurados.',
      });
    }

    const { ipConexao, portaConexao } = movimentacao.equipamento;
    const empresa = movimentacao.filial.empresa;
    const etiquetaPadraoFilial = movimentacao.filial.etiquetaPadrao;

    const zplCommands: string[] = [];
    const produtosIgnorados: string[] = [];

    const codigos = movimentacao.importacaoItens.map((i) => i.codigo);
    const produtos = await this.prisma.produto.findMany({
      where: { codigo: { in: codigos } },
      include: { modeloEtiqueta: true },
    });
    const produtoMap = new Map(produtos.map((p) => [p.codigo, p]));

    // Fetch only the tags linked to this movimentação via MovimentacaoItem
    const movItens = await this.prisma.movimentacaoItem.findMany({
      where: { idMovimentacao, ocorrencia: 'LEITURA' },
      include: {
        tagRfid: {
          include: { produto: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const item of movimentacao.importacaoItens) {
      const produto = produtoMap.get(item.codigo);
      if (!produto) continue;

      const etiqueta = produto.modeloEtiqueta || etiquetaPadraoFilial;
      if (!etiqueta) {
        produtosIgnorados.push(produto.codigo);
        continue;
      }

      // Only process tags from this movimentação for this product
      const tagsDesteProduto = movItens
        .filter((mi) => mi.tagRfid?.produto?.codigo === item.codigo)
        .map((mi) => mi.tagRfid!)
        .filter(Boolean);

      for (const tag of tagsDesteProduto) {
        const zpl = this.processZplTemplate(etiqueta.codigoZPL, {
          empresa,
          produto,
          tag,
        });
        zplCommands.push(this.ensureUtf8Encoding(zpl));
      }
    }

    if (zplCommands.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message:
          produtosIgnorados.length > 0
            ? `Nenhuma tag pôde ser impressa. Os seguintes produtos não possuem etiqueta vinculada: ${produtosIgnorados.join(', ')}.`
            : 'Nenhuma tag encontrada para impressão.',
      });
    }

    // Client-side printing: return ZPL commands + connection info for the frontend to send directly
    if (clientSide) {
      return {
        movimentacaoId: idMovimentacao,
        totalImpressas: zplCommands.length,
        produtosIgnorados,
        ipConexao,
        portaConexao,
        zplCommands,
      };
    }

    // Server-side printing (default): send ZPL via TCP to the printer
    await this.sendZplViaTcp(ipConexao, portaConexao, zplCommands.join('\n'));

    return {
      movimentacaoId: idMovimentacao,
      totalImpressas: zplCommands.length,
      produtosIgnorados,
      equipamento: `${ipConexao}:${portaConexao}`,
    };
  }

  // ── ZPL Template Processing ────────────────────────────

  private processZplTemplate(
    template: string,
    context: { empresa: any; produto: any; tag: any },
  ): string {
    return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, entity, field) => {
      const { empresa, produto, tag } = context;

      let source: any;
      switch (entity) {
        case 'empresa':
          source = empresa;
          break;
        case 'produto':
          source = produto;
          break;
        case 'tag':
          source = tag;
          break;
        default:
          return match;
      }

      if (source && field in source) {
        const value = source[field];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) {
          const d = String(value.getDate()).padStart(2, '0');
          const m = String(value.getMonth() + 1).padStart(2, '0');
          const y = value.getFullYear();
          return `${d}/${m}/${y}`;
        }
        return this.sanitizeZplValue(String(value));
      }

      return match;
    });
  }

  /**
   * Escapa caracteres de controle ZPL para prevenir injeção de
   * comandos via dados do banco (nomes de produto, empresa, etc).
   */
  private sanitizeZplValue(value: string): string {
    return value.replace(/[\^~]/g, '');
  }

  /**
   * Garante `^CI28` (UTF-8) logo após o `^XA` de cada etiqueta.
   *
   * O payload é enviado como UTF-8 (tanto daqui quanto do app, via
   * `Socket.write` do Dart), mas a impressora Zebra assume code page 850 por
   * padrão. Sem o `^CI28`, todo acento do português — "Calçado", "Botina Nº
   * 42" — sai como caractere trocado na etiqueta.
   *
   * Templates que já declaram um `^CI` são respeitados: a escolha é de quem
   * escreveu o modelo.
   */
  private ensureUtf8Encoding(zpl: string): string {
    if (/\^CI\d/i.test(zpl)) return zpl;
    return zpl.replace(/\^XA/i, '^XA^CI28');
  }

  // ── TCP/IP Send ────────────────────────────────────────

  /**
   * Validates that the target IP is a safe printer address.
   * Blocks loopback, link-local, cloud metadata, and non-IP values.
   */
  private validatePrinterIp(ip: string): void {
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    if (!match) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Endereço IP inválido para impressora: ${ip}`,
      });
    }

    const octets = match.slice(1).map(Number);

    if (octets[0] === 127) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Não é permitido conectar ao endereço loopback.',
      });
    }

    if (octets[0] === 169 && octets[1] === 254) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Não é permitido conectar a endereços link-local.',
      });
    }

    if (octets.every((o) => o === 0)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Endereço IP inválido para impressora.',
      });
    }
  }

  private sendZplViaTcp(ip: string, port: number, data: string): Promise<void> {
    this.validatePrinterIp(ip);

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 10000;

      socket.setTimeout(timeout);

      socket.connect(port, ip, () => {
        socket.write(data, 'utf-8', () => {
          socket.end();
        });
      });

      socket.on('close', () => resolve());
      socket.on('error', (err: Error) => {
        socket.destroy();
        reject(
          new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Erro ao enviar para a impressora (${ip}:${port}): ${err.message}`,
          }),
        );
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(
          new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Timeout ao conectar na impressora (${ip}:${port}).`,
          }),
        );
      });
    });
  }
}
