import type { SituacaoMovimentacao } from 'models/enums';
import MovimentacaoStepDialog from '../shared/MovimentacaoStepDialog';
import Conferencia from './';

// ── Types ───────────────────────────────────────────────────

interface ConferenciaDialogProps {
  movimentacaoId: number | null;
  situacao: SituacaoMovimentacao;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────

const ConferenciaDialog = ({ movimentacaoId, situacao, open, onClose }: ConferenciaDialogProps) => (
  <MovimentacaoStepDialog
    open={open}
    onClose={onClose}
    title="Conferência — Verificação de Tags RFID"
    movimentacaoId={movimentacaoId}
    defaultProcessLabel="Concluir Conferência"
    defaultProcessTooltip="Concluir a conferência de tags"
  >
    {(ref, onStateChange) => (
      <Conferencia ref={ref} movimentacaoId={movimentacaoId!} situacao={situacao} onComplete={onClose} onStateChange={onStateChange} />
    )}
  </MovimentacaoStepDialog>
);

export default ConferenciaDialog;
