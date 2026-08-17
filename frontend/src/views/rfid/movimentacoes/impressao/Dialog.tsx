import type { SituacaoMovimentacao } from 'models/enums';
import MovimentacaoStepDialog from '../shared/MovimentacaoStepDialog';
import Impressao from './';

// ── Types ───────────────────────────────────────────────────

interface ImpressaoDialogProps {
  movimentacaoId: number | null;
  situacao: SituacaoMovimentacao;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────

const ImpressaoDialog = ({ movimentacaoId, situacao, open, onClose }: ImpressaoDialogProps) => (
  <MovimentacaoStepDialog open={open} onClose={onClose} title="Importação — Impressão de Etiquetas" movimentacaoId={movimentacaoId}>
    {(ref, onStateChange) => (
      <Impressao ref={ref} movimentacaoId={movimentacaoId!} situacao={situacao} onComplete={onClose} onStateChange={onStateChange} />
    )}
  </MovimentacaoStepDialog>
);

export default ImpressaoDialog;
