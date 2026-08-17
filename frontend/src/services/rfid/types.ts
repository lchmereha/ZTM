/** Modelo de uma tag RFID recebida via WebSocket */
export interface RfidTag {
  codigoRfid: string;
  rssi: string;
  tid: string;
}

/** Tag com contagem de leituras (deduplicada por EPC) */
export interface RfidTagWithCounter {
  tag: RfidTag;
  count: number;
}
