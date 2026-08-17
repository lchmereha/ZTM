import { type RfidTag, type RfidTagWithCounter } from './types';

/**
 * Gerenciador da lista de etiquetas lidas.
 *
 * Usa um buffer interno que é mesclado à lista principal a cada 500ms,
 * evitando re-renders excessivos quando milhares de tags chegam por segundo.
 */
export class RfidTagManager {
  private _tags: RfidTagWithCounter[] = [];
  /** O(1) index: codigoRfid → position in _tags */
  private _tagIndex: Map<string, number> = new Map();
  private _buffer: Map<string, RfidTagWithCounter> = new Map();
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _onChange: ((tags: RfidTagWithCounter[]) => void) | null = null;

  constructor(onChange?: (tags: RfidTagWithCounter[]) => void) {
    this._onChange = onChange ?? null;
    this._startTimer(500);
  }

  // ── Timer ─────────────────────────────────────────────────

  private _startTimer(intervalMs: number) {
    this._timer = setInterval(() => {
      if (this._buffer.size > 0) {
        this._mergeBuffer();
        this._onChange?.([...this._tags]);
      }
    }, intervalMs);
  }

  private _mergeBuffer() {
    for (const buffered of this._buffer.values()) {
      const idx = this._tagIndex.get(buffered.tag.codigoRfid);
      if (idx === undefined) {
        const newIdx = this._tags.length;
        this._tags.push({ ...buffered });
        this._tagIndex.set(buffered.tag.codigoRfid, newIdx);
      } else {
        this._tags[idx].count += buffered.count;
      }
    }
    this._buffer.clear();
  }

  // ── Public API ────────────────────────────────────────────

  /** Adiciona uma tag ou incrementa seu contador se já existir */
  addOrIncrement(tag: RfidTag) {
    const existing = this._buffer.get(tag.codigoRfid);
    if (existing) {
      existing.count++;
    } else {
      this._buffer.set(tag.codigoRfid, { tag, count: 1 });
    }
  }

  /** Alias para addOrIncrement */
  addTag(tag: RfidTag) {
    this.addOrIncrement(tag);
  }

  /** Remove todas as tags e limpa o buffer */
  clear() {
    this._tags = [];
    this._tagIndex.clear();
    this._buffer.clear();
    this._onChange?.([]);
  }

  /** Retorna snapshot imutável da lista de tags */
  getTags(): RfidTagWithCounter[] {
    return [...this._tags];
  }

  /** Retorna apenas os EPCs (codigoRfid) */
  getEpcs(): string[] {
    return this._tags.map((t) => t.tag.codigoRfid);
  }

  /** Libera o timer ao desmontar */
  dispose() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /** Substitui o callback de notificação */
  setOnChange(fn: (tags: RfidTagWithCounter[]) => void) {
    this._onChange = fn;
  }
}
