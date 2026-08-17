import type { SituacaoMovimentacao } from 'models/enums';
import MovimentacaoStepDialog from '../shared/MovimentacaoStepDialog';
import Transferencia from './';

// ── Types ───────────────────────────────────────────────────

interface TransferenciaDialogProps {
  movimentacaoId: number | null;
  situacao: SituacaoMovimentacao;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────

const TransferenciaDialog = ({ movimentacaoId, situacao, open, onClose }: TransferenciaDialogProps) => (
  <MovimentacaoStepDialog
    open={open}
    onClose={onClose}
    title="Transferência — Transferência de Tags RFID"
    movimentacaoId={movimentacaoId}
    defaultProcessLabel="Concluir Transferência"
    defaultProcessTooltip="Concluir a transferência de tags"
  >
    {(ref, onStateChange) => (
      <Transferencia ref={ref} movimentacaoId={movimentacaoId!} situacao={situacao} onComplete={onClose} onStateChange={onStateChange} />
    )}
  </MovimentacaoStepDialog>
);

export default TransferenciaDialog;
