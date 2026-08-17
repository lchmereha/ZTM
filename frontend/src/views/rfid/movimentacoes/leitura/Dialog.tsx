import { useRef, useState } from 'react';

// MUI
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

// Local
import type { LeituraHandler } from './';
import Leitura from './';

// ── Props ───────────────────────────────────────────────────

interface LeituraDialogProps {
  movimentacaoId: number | null;
  situacao: string;
  open: boolean;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────

const LeituraDialog = ({ movimentacaoId, situacao, open, onClose }: LeituraDialogProps) => {
  const leituraRef = useRef<LeituraHandler>(null);
  const isFinalizado = situacao === 'FINALIZADO';
  // Initial choice state is derived from situacao; subsequent changes come from onModeChange callback
  const [isChoice, setIsChoice] = useState(() => !isFinalizado);
  const [isReading, setIsReading] = useState(false);

  return (
    <Dialog
      fullWidth
      maxWidth={isChoice ? 'sm' : isFinalizado ? 'md' : 'lg'}
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        if (leituraRef.current?.isReading) return;
        onClose();
      }}
    >
      <DialogTitle>{isFinalizado ? 'Relatório de Baixa' : 'Leitura RFID'}</DialogTitle>
      <DialogContent dividers>
        {movimentacaoId && (
          <Leitura
            ref={leituraRef}
            movimentacaoId={movimentacaoId}
            situacao={situacao}
            onComplete={onClose}
            onModeChange={(mode) => setIsChoice(mode === 'escolha')}
            onStateChange={() => setIsReading(!!leituraRef.current?.isReading)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={isReading}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeituraDialog;
