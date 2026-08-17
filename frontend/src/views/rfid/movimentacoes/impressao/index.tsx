import { forwardRef } from 'react';

// Models
import type { SituacaoMovimentacao } from 'models/enums';

// Shared
import StepOrchestrator from '../shared/StepOrchestrator';
import type { MovimentacaoStepHandler } from '../shared/types';

// Local
import ImpressaoProcessamento from './Processamento';
import ImpressaoResultado from './Resultado';

// ── Re-exports ──────────────────────────────────────────────

export type { MovimentacaoStepHandler } from '../shared/types';

// ── Props ───────────────────────────────────────────────────

interface ImpressaoProps {
  movimentacaoId: number;
  situacao: SituacaoMovimentacao;
  onComplete?: () => void;
  onStateChange?: () => void;
}

// ── Step Map ────────────────────────────────────────────────

const STEPS = {
  IMPORTADO: { component: ImpressaoProcessamento },
  PROCESSADO: { component: ImpressaoResultado },
  FINALIZADO: { component: ImpressaoResultado, props: { finalizado: true } }
};

// ── Component ───────────────────────────────────────────────

/**
 * Orchestrator component — renders the correct step based on the movimentação's situacao.
 *
 * CRIADO      → ImportacaoStep          (import spreadsheet, edit, save/process)
 * IMPORTADO   → ImpressaoProcessamento  (generate RFID tags)
 * PROCESSADO  → ImpressaoResultado      (report + print)
 * FINALIZADO  → ImpressaoResultado      (reprint)
 */
const Impressao = forwardRef<MovimentacaoStepHandler, ImpressaoProps>((props, ref) => (
  <StepOrchestrator ref={ref} importMode="impressao" steps={STEPS} {...props} />
));

export default Impressao;
