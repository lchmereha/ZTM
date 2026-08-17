import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BatchAdapterService {
  private readonly logger = new Logger(BatchAdapterService.name);
  private static readonly TTL_MS = 20 * 60 * 1000; // 20 minutes

  private associacaoCache = new Map<
    number,
    { idProduto: number; codigoRfid: string }[]
  >();
  private conferenciaCache = new Map<
    number,
    { idProduto: number; idTagRfid: number; codigoRfidLido: string }[]
  >();
  private transferenciaCache = new Map<
    number,
    { idProduto: number; idTagRfid: number; codigoRfidLido: string }[]
  >();
  private leituraCache = new Map<number, string[]>();
  private timers = new Map<number, NodeJS.Timeout>();

  // ── Timer Management ──────────────────────────────────────

  private resetTimer(movId: number) {
    const existing = this.timers.get(movId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.logger.warn(
        `Cache expirado para movimentação ${movId} (TTL de ${BatchAdapterService.TTL_MS / 60000} minutos). Limpando dados.`,
      );
      this.clearCache(movId);
    }, BatchAdapterService.TTL_MS);

    this.timers.set(movId, timer);
  }

  private clearTimer(movId: number) {
    const timer = this.timers.get(movId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(movId);
    }
  }

  clearCache(movId: number) {
    this.associacaoCache.delete(movId);
    this.conferenciaCache.delete(movId);
    this.transferenciaCache.delete(movId);
    this.leituraCache.delete(movId);
    this.clearTimer(movId);
  }

  // ── Associação ────────────────────────────────────────────

  appendAssociacao(
    movId: number,
    tags: { idProduto: number; codigoRfid: string }[],
  ) {
    const existing = this.associacaoCache.get(movId) ?? [];
    existing.push(...tags);
    this.associacaoCache.set(movId, existing);
    this.resetTimer(movId);
    return { totalAcumulado: existing.length };
  }

  flushAssociacao(movId: number): { idProduto: number; codigoRfid: string }[] {
    const data = this.associacaoCache.get(movId) ?? [];
    this.associacaoCache.delete(movId);
    this.clearTimer(movId);
    return data;
  }

  // ── Conferência ───────────────────────────────────────────

  appendConferencia(
    movId: number,
    vinculacoes: {
      idProduto: number;
      idTagRfid: number;
      codigoRfidLido: string;
    }[],
  ) {
    const existing = this.conferenciaCache.get(movId) ?? [];
    existing.push(...vinculacoes);
    this.conferenciaCache.set(movId, existing);
    this.resetTimer(movId);
    return { totalAcumulado: existing.length };
  }

  flushConferencia(
    movId: number,
  ): { idProduto: number; idTagRfid: number; codigoRfidLido: string }[] {
    const data = this.conferenciaCache.get(movId) ?? [];
    this.conferenciaCache.delete(movId);
    this.clearTimer(movId);
    return data;
  }

  // ── Transferência ───────────────────────────────────────────

  appendTransferencia(
    movId: number,
    vinculacoes: {
      idProduto: number;
      idTagRfid: number;
      codigoRfidLido: string;
    }[],
  ) {
    const existing = this.transferenciaCache.get(movId) ?? [];
    existing.push(...vinculacoes);
    this.transferenciaCache.set(movId, existing);
    this.resetTimer(movId);
    return { totalAcumulado: existing.length };
  }

  flushTransferencia(
    movId: number,
  ): { idProduto: number; idTagRfid: number; codigoRfidLido: string }[] {
    const data = this.transferenciaCache.get(movId) ?? [];
    this.transferenciaCache.delete(movId);
    this.clearTimer(movId);
    return data;
  }

  // ── Leitura ───────────────────────────────────────────────

  appendLeitura(movId: number, codigosRfid: string[]) {
    const existing = this.leituraCache.get(movId) ?? [];
    existing.push(...codigosRfid);
    this.leituraCache.set(movId, existing);
    this.resetTimer(movId);
    return { totalAcumulado: existing.length };
  }

  flushLeitura(movId: number): string[] {
    const data = this.leituraCache.get(movId) ?? [];
    this.leituraCache.delete(movId);
    this.clearTimer(movId);
    return data;
  }
}
