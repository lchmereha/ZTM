import type { SituacaoMovimentacao } from 'models/enums';
import MovimentacaoStepDialog from '../shared/MovimentacaoStepDialog';
import Associacao from './';

// ── Types ───────────────────────────────────────────────────

interface AssociacaoDialogProps {
  movimentacaoId: number | null;
  situacao: SituacaoMovimentacao;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────

const AssociacaoDialog = ({ movimentacaoId, situacao, open, onClose }: AssociacaoDialogProps) => (
  <MovimentacaoStepDialog
    open={open}
    onClose={onClose}
    title="Associação — Tags RFID a Produtos"
    movimentacaoId={movimentacaoId}
    defaultProcessLabel="Concluir Associação"
    defaultProcessTooltip="Concluir a associação de tags"
  >
    {(ref, onStateChange) => (
      <Associacao ref={ref} movimentacaoId={movimentacaoId!} situacao={situacao} onComplete={onClose} onStateChange={onStateChange} />
    )}
  </MovimentacaoStepDialog>
);

export default AssociacaoDialog;
