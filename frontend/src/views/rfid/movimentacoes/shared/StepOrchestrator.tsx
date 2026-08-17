import { forwardRef, useCallback, useState } from 'react';

// Models
import type { SituacaoMovimentacao } from 'models/enums';

// Shared
import ImportacaoStep from './ImportacaoStep';
import type { MovimentacaoStepHandler } from './types';

// ── Re-exports ──────────────────────────────────────────────

export type { MovimentacaoStepHandler } from './types';

// ── Types ───────────────────────────────────────────────────

interface StepConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Step components have varying prop types
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
}

interface StepOrchestratorProps {
  movimentacaoId: number;
  situacao: SituacaoMovimentacao;
  /** Mode for the ImportacaoStep (CRIADO stage) */
  importMode: 'impressao' | 'associacao' | 'conferencia' | 'transferencia';
  /** Maps situacao → component to render. CRIADO is always ImportacaoStep with the given importMode. */
  steps: Record<string, StepConfig>;
  onComplete?: () => void;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

/**
 * Generic orchestrator — renders the correct step based on the movimentação's situacao.
 *
 * CRIADO → ImportacaoStep (with the given importMode)
 * Other  → Resolved from the `steps` map
 */
const StepOrchestrator = forwardRef<MovimentacaoStepHandler, StepOrchestratorProps>(
  ({ movimentacaoId, situacao: initialSituacao, importMode, steps, onComplete, onStateChange }, ref) => {
    const [situacao, setSituacao] = useState<SituacaoMovimentacao>(initialSituacao);

    const handleSituacaoChange = useCallback(
      (newSituacao: string) => {
        setSituacao(newSituacao as SituacaoMovimentacao);
        // Trigger parent re-render so it picks up the new step's imperative handle
        onStateChange?.();
      },
      [onStateChange]
    );

    const sharedProps = { movimentacaoId, onComplete, onStateChange, onSituacaoChange: handleSituacaoChange };

    if (situacao === 'CRIADO') {
      return <ImportacaoStep ref={ref} mode={importMode} {...sharedProps} />;
    }

    const stepConfig = steps[situacao];
    if (stepConfig) {
      const StepComponent = stepConfig.component;
      return <StepComponent ref={ref} {...sharedProps} {...(stepConfig.props || {})} />;
    }

    return null;
  }
);

export default StepOrchestrator;
