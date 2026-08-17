import { forwardRef } from 'react';

// Models
import type { SituacaoMovimentacao } from 'models/enums';

// Shared
import StepOrchestrator from '../shared/StepOrchestrator';
import type { MovimentacaoStepHandler } from '../shared/types';

// Local
import ConferenciaLeitura from './Leitura';
import ConferenciaRelatorio from './Relatorio';

// ── Re-exports ──────────────────────────────────────────────

export type { MovimentacaoStepHandler as ConferenciaHandler } from '../shared/types';

// ── Props ───────────────────────────────────────────────────

interface ConferenciaProps {
  movimentacaoId: number;
  situacao: SituacaoMovimentacao;
  onComplete?: () => void;
  onStateChange?: () => void;
}

// ── Step Map ────────────────────────────────────────────────

const STEPS = {
  IMPORTADO: { component: ConferenciaLeitura },
  FINALIZADO: { component: ConferenciaRelatorio }
};

// ── Component ───────────────────────────────────────────────

/**
 * Orchestrator component — renders the correct step based on the movimentação's situacao.
 *
 * CRIADO      → ImportacaoStep  (import spreadsheet, shared component)
 * IMPORTADO   → ConferenciaLeitura  (verify RFID tags against products)
 * FINALIZADO  → finished state (view only)
 */
const Conferencia = forwardRef<MovimentacaoStepHandler, ConferenciaProps>((props, ref) => (
  <StepOrchestrator ref={ref} importMode="conferencia" steps={STEPS} {...props} />
));

export default Conferencia;
