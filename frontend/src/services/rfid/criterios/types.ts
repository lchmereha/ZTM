/**
 * Módulo de Critérios de Validação de Tags RFID — DORMANT
 *
 * Estes tipos e lógica são tradução direta do Dart e estão prontos para uso,
 * mas NENHUMA view os importa atualmente. Ativar quando a API de critérios
 * estiver integrada.
 */

// ── Constants & Types (Erasable) ──────────────────────────────

export const ClassificacaoCriterio = {
  principal: 'principal',
  detalhe: 'detalhe',
  validacao: 'validacao'
} as const;
export type ClassificacaoCriterio = (typeof ClassificacaoCriterio)[keyof typeof ClassificacaoCriterio];

export const ComparacaoCriterio = {
  igual: 'igual',
  diferente: 'diferente',
  maior: 'maior',
  menor: 'menor',
  contem: 'contem',
  contador: 'contador'
} as const;
export type ComparacaoCriterio = (typeof ComparacaoCriterio)[keyof typeof ComparacaoCriterio];

export const TipoCharCriterio = {
  hexadecimal: 'hexadecimal',
  texto: 'texto'
} as const;
export type TipoCharCriterio = (typeof TipoCharCriterio)[keyof typeof TipoCharCriterio];

// ── Interfaces ──────────────────────────────────────────────

export interface CampoCriterio {
  campo?: string;
  posicaoInicial?: number;
  qtdeCaracteres?: number;
}

export interface Criterio {
  acumula?: boolean;
  campo?: CampoCriterio;
  campoComparativo?: CampoCriterio;
  classificacao?: ClassificacaoCriterio;
  comparacao?: ComparacaoCriterio;
  itemValidacaoPrincipal?: Criterio;
  tipoCaracterRFID?: TipoCharCriterio;
  valorComparativo?: string;
}

export interface ValidatedTag {
  epc: string;
  rssi?: string;
  convertedValue?: string;
  matchedCriterios: Criterio[];
  errors: string[];
}

export interface TagBlock {
  principal: ValidatedTag;
  filhas: ValidatedTag[];
  expectedChildrenCount?: number;
  errors: string[];
}
