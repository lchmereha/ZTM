// Enums espelhados do Prisma Schema (usando const objects para compatibilidade com erasableSyntaxOnly)
export const UsuarioRole = {
  OPERADOR: 'OPERADOR',
  ADMIN: 'ADMIN'
} as const;
export type UsuarioRole = (typeof UsuarioRole)[keyof typeof UsuarioRole];

export const TipoEquipamento = {
  IMPRESSORA: 'IMPRESSORA',
  ANTENA: 'ANTENA',
  SLED: 'SLED'
} as const;
export type TipoEquipamento = (typeof TipoEquipamento)[keyof typeof TipoEquipamento];

export const TipoOpcaoMovimentacao = {
  IMPRESSAO: 'IMPRESSAO',
  ASSOCIACAO: 'ASSOCIACAO',
  LEITURA: 'LEITURA',
  CONFERENCIA: 'CONFERENCIA',
  TRANSFERENCIA: 'TRANSFERENCIA'
} as const;
export type TipoOpcaoMovimentacao = (typeof TipoOpcaoMovimentacao)[keyof typeof TipoOpcaoMovimentacao];

export const OcorrenciaItem = {
  LEITURA: 'LEITURA',
  INCLUSAO: 'INCLUSAO',
  ENCONTRADO: 'ENCONTRADO',
  NAO_ENCONTRADO: 'NAO_ENCONTRADO'
} as const;
export type OcorrenciaItem = (typeof OcorrenciaItem)[keyof typeof OcorrenciaItem];

export const SituacaoMovimentacao = {
  CRIADO: 'CRIADO',
  IMPORTADO: 'IMPORTADO',
  PROCESSADO: 'PROCESSADO',
  FINALIZADO: 'FINALIZADO'
} as const;
export type SituacaoMovimentacao = (typeof SituacaoMovimentacao)[keyof typeof SituacaoMovimentacao];
