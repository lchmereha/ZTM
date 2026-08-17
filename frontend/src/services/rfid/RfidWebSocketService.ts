import type { RfidTag } from './types';

export const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
} as const;
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

export interface InventoryOptions {
  power?: number;
  tagFocus?: boolean;
  buzzer?: boolean;
  rssiFilter?: { min: number; max: number };
}

export interface ConnectionHandlers {
  onStatusChange?: (status: ConnectionStatus) => void;
  onTagRead?: (tag: RfidTag) => void;
  onError?: (error: unknown) => void;
}

/**
 * Serviço singleton de conexão WebSocket para leitura de etiquetas RFID.
 */
export class RfidWebSocketService {
  private _ws: WebSocket | null = null;
  private _url: string = '';
  private _isReading: boolean = false;
  private _status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private _pendingSettings?: InventoryOptions;
  private _rssiFilter?: { min: number; max: number };

  // Callbacks
  onTag: ((tag: RfidTag) => void) | null = null;
  onStatusChange: ((status: ConnectionStatus) => void) | null = null;
  onError: ((error: string) => void) | null = null;

  get isReading(): boolean {
    return this._isReading;
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  get url(): string {
    return this._url;
  }

  /**
   * Faz o parsing do RSSI que vem do equipamento como float negativo
   * com vírgula como separador decimal (ex: "-71,60").
   * Retorna o valor absoluto como número (ex: 71.60).
   * Retorna null se não for possível parsear.
   */
  private _parseRssi(rssiRaw: string): number | null {
    if (!rssiRaw || rssiRaw.trim() === '') return null;
    // Trocar vírgula por ponto para compatibilidade com parseFloat
    const normalized = rssiRaw.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (isNaN(parsed)) return null;
    // Retornar valor absoluto — no RSSI, o que importa é a magnitude
    return Math.abs(parsed);
  }

  /**
   * Verifica se o RSSI da tag está dentro do range configurado.
   * Se o filtro não estiver ativo, retorna true (aceita tudo).
   */
  private _isRssiInRange(rssiRaw: string): boolean {
    if (!this._rssiFilter) return true;
    const absRssi = this._parseRssi(rssiRaw);
    if (absRssi === null) return true; // Se não conseguiu parsear, aceita a tag
    return absRssi >= this._rssiFilter.min && absRssi <= this._rssiFilter.max;
  }

  private _setStatus(status: ConnectionStatus) {
    this._status = status;
    this.onStatusChange?.(status);
  }

  /**
   * Tenta conectar ao WebSocket. Resolve quando a conexão é aberta.
   */
  connect(url: string, handlers?: ConnectionHandlers): Promise<void> {
    if (handlers) {
      if (handlers.onStatusChange) this.onStatusChange = handlers.onStatusChange;
      if (handlers.onTagRead) this.onTag = handlers.onTagRead;
      if (handlers.onError) this.onError = (err) => handlers.onError?.(err);
    }

    return new Promise((resolve, reject) => {
      this.disconnect();
      this._url = url;
      this._setStatus(ConnectionStatus.CONNECTING);

      try {
        this._ws = new WebSocket(url);
      } catch {
        this._setStatus(ConnectionStatus.ERROR);
        this.onError?.('URL inválida');
        reject(new Error(`URL inválida: ${url}`));
        return;
      }

      const timeout = setTimeout(() => {
        this._ws?.close();
        this._setStatus(ConnectionStatus.ERROR);
        reject(new Error('Timeout de conexão (5s)'));
      }, 5000);

      this._ws.onopen = () => {
        clearTimeout(timeout);
        this._setStatus(ConnectionStatus.CONNECTED);
        if (this._pendingSettings) {
          this.sendSettings(this._pendingSettings);
          this._pendingSettings = undefined;
        }
        resolve();
      };

      this._ws.onerror = (e) => {
        clearTimeout(timeout);
        this._setStatus(ConnectionStatus.ERROR);
        this.onError?.('Falha na conexão WebSocket');
        reject(e);
      };

      this._ws.onclose = () => {
        this._isReading = false;
        if (this._status !== ConnectionStatus.ERROR) {
          this._setStatus(ConnectionStatus.DISCONNECTED);
        }
      };

      this._ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const tag: RfidTag = {
            codigoRfid: data.epc ?? data.codigoRfid ?? '',
            rssi: data.rssi ?? '',
            tid: data.tid ?? ''
          };
          if (tag.codigoRfid && this._isRssiInRange(tag.rssi)) {
            this.onTag?.(tag);
          }
        } catch {
          // Mensagens não-JSON (acks) são ignoradas
        }
      };
    });
  }

  /** Envia configurações para o equipamento (formato compatível com protocolo do leitor) */
  sendSettings(options: InventoryOptions) {
    // Atualizar o filtro de RSSI (aplicado client-side no onmessage)
    this._rssiFilter = options.rssiFilter;

    if (this._ws?.readyState !== WebSocket.OPEN) return;

    this._ws.send('conectar');

    if (options.power !== undefined) {
      this._ws.send(`power=${options.power}`);
    }
    if (options.buzzer !== undefined) {
      this._ws.send(`beep=${options.buzzer}`);
    }
    if (options.tagFocus !== undefined) {
      this._ws.send(`tagFocus=${options.tagFocus}`);
    }
  }

  /**
   * Armazena configurações para serem enviadas ao conectar.
   * Se já estiver conectado, envia imediatamente.
   */
  configureOnConnect(options: InventoryOptions) {
    // Sempre atualizar o filtro de RSSI, mesmo se não estiver conectado ainda
    this._rssiFilter = options.rssiFilter;

    if (this._ws?.readyState === WebSocket.OPEN) {
      this.sendSettings(options);
    } else {
      this._pendingSettings = options;
    }
  }

  /** Envia comando de início de leitura */
  async startInventory(options?: InventoryOptions) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      if (options) {
        this.sendSettings(options);
      }
      this._ws.send('iniciar');
      this._isReading = true;
    }
  }

  /** Envia comando de parada de leitura */
  async stopInventory() {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send('parar');
    }
    this._isReading = false;
  }

  /** Alias para startInventory */
  startReading() {
    return this.startInventory();
  }

  /** Alias para stopInventory */
  stopReading() {
    return this.stopInventory();
  }

  /** Fecha o WebSocket */
  disconnect() {
    this.stopInventory();
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.close();
      this._ws = null;
    }
    this._setStatus(ConnectionStatus.DISCONNECTED);
  }
}
