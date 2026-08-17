// ── Shared types for MovimentacaoDados tabs ─────────────────

import type { Produto } from 'models/produto';
import type { TagRfid } from 'models/tag-rfid';

// ImportacaoItem — model already matches exactly
export type { ImportacaoItem } from 'models/importacao-item';

// ProdutoRow — model already has categoria/modeloEtiqueta relations
export type ProdutoRow = Produto;

// TagRfidRow — extends TagRfid overriding produto with a lightweight shape
export interface TagRfidRow extends Omit<TagRfid, 'produto' | 'filial'> {
  produto?: Pick<Produto, 'codigo' | 'nome'>;
}

export type EditDialogType = 'importItem' | 'produto' | 'tagRfid' | 'associacaoItem' | 'conferenciaItem';

export interface OpenEditFn {
  setEditDialogType: (type: EditDialogType) => void;
  setEditDialogTitle: (title: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
  setEditDialogValues: (values: any) => void;
  setEditDialogOpen: (open: boolean) => void;
}

/** Common sx overrides applied to all DataGrids in this dialog */
export const dataGridActionsSx = {
  '& .MuiDataGrid-cell[data-field="actions"]': {
    p: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  '& .MuiDataGrid-columnHeader[data-field="actions"]': {
    p: 0,
    minWidth: '0 !important'
  },
  '& .MuiDataGrid-cell:focus': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-within': { outline: 'none' }
};

export const fmtDate = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('pt-BR') : '');
