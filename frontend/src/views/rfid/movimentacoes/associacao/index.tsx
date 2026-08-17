import { forwardRef } from 'react';

// Models
import type { SituacaoMovimentacao } from 'models/enums';

// Shared
import StepOrchestrator from '../shared/StepOrchestrator';
import type { MovimentacaoStepHandler } from '../shared/types';

// Local
import AssociacaoLeitura from './Leitura';
import AssociacaoRelatorio from './Relatorio';

// ── Re-exports ──────────────────────────────────────────────

export type { MovimentacaoStepHandler as AssociacaoHandler } from '../shared/types';

// ── Props ───────────────────────────────────────────────────

interface AssociacaoProps {
  movimentacaoId: number;
  situacao: SituacaoMovimentacao;
  onComplete?: () => void;
  onStateChange?: () => void;
}

// ── Step Map ────────────────────────────────────────────────

const STEPS = {
  IMPORTADO: { component: AssociacaoLeitura },
  FINALIZADO: { component: AssociacaoRelatorio }
};

// ── Component ───────────────────────────────────────────────

/**
 * Orchestrator component — renders the correct step based on the movimentação's situacao.
 *
 * CRIADO      → ImportacaoStep  (import spreadsheet, shared component)
 * IMPORTADO   → AssociacaoLeitura    (read physical RFID tags + associate to products)
 * FINALIZADO  → finished state (view only)
 */
const Associacao = forwardRef<MovimentacaoStepHandler, AssociacaoProps>((props, ref) => (
  <StepOrchestrator ref={ref} importMode="associacao" steps={STEPS} {...props} />
));

export default Associacao;
