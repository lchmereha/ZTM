// ── Types shared across Movimentação steps ──────────────────

import type { ImportacaoItem } from 'models/importacao-item';

/**
 * Extends the backend ImportacaoItem model with UI-specific fields
 * used by the staging DataGrid.
 */
export interface ImportItem extends Omit<ImportacaoItem, 'idMovimentacao' | 'createdAt' | 'updatedAt'> {
  exists: boolean;
  hasError?: boolean;
  errorMessage?: string;
  /** Warning state (e.g., quantity exceeds active tags in conferência) — blocks submission */
  hasWarning?: boolean;
  warningMessage?: string;
  totalTagsAtivas?: number;
  posicaoEstoque?: string | null;
}

/**
 * Handle exposed by each step component via forwardRef/useImperativeHandle.
 * The parent dialog reads these to render reactive actions.
 */
export interface MovimentacaoStepHandler {
  /** Primary action (ex: Salvar) */
  handleSave?: () => Promise<void>;
  /** Secondary action (ex: Processar / Imprimir) */
  handleProcess?: () => Promise<void>;
  /** Label for the process button (default: 'Processar') */
  processLabel?: string;
  /** Label for the process button while submitting (default: 'Processando...') */
  processLabelSubmitting?: string;
  /** Tooltip for the process button (default: 'Salvar e processar dados') */
  processTooltip?: string;
  /** Icon key for the process button: 'print' | 'process' (default: 'process') */
  processIcon?: 'print' | 'process';
  /** Whether the step has actionable data */
  hasData: boolean;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Whether an RFID reading is in progress */
  isReading?: boolean;
  /** Whether the help tooltip should be displayed */
  showHelp?: boolean;
}
