import { forwardRef } from 'react';

// Models
import type { SituacaoMovimentacao } from 'models/enums';

// Shared
import StepOrchestrator from '../shared/StepOrchestrator';
import type { MovimentacaoStepHandler } from '../shared/types';

// Local
import TransferenciaLeitura from './Leitura';
import TransferenciaRelatorio from './Relatorio';

// ── Re-exports ──────────────────────────────────────────────

export type { MovimentacaoStepHandler as TransferenciaHandler } from '../shared/types';

// ── Props ───────────────────────────────────────────────────

interface TransferenciaProps {
  movimentacaoId: number;
  situacao: SituacaoMovimentacao;
  onComplete?: () => void;
  onStateChange?: () => void;
}

// ── Step Map ────────────────────────────────────────────────

const STEPS = {
  IMPORTADO: { component: TransferenciaLeitura },
  FINALIZADO: { component: TransferenciaRelatorio }
};

// ── Component ───────────────────────────────────────────────

/**
 * Orchestrator component — renders the correct step based on the movimentação's situacao.
 *
 * CRIADO      → ImportacaoStep  (import spreadsheet, shared component)
 * IMPORTADO   → TransferenciaLeitura  (verify RFID tags against products)
 * FINALIZADO  → finished state (view only)
 */
const Transferencia = forwardRef<MovimentacaoStepHandler, TransferenciaProps>((props, ref) => (
  <StepOrchestrator ref={ref} importMode="transferencia" steps={STEPS} {...props} />
));

export default Transferencia;
