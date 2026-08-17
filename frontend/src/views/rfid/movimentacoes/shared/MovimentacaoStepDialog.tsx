import { type ReactNode, useCallback, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import PrintIcon from '@mui/icons-material/Print';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import SaveIcon from '@mui/icons-material/Save';

// MUI
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

// Project
import type { MovimentacaoStepHandler } from './types';

// ── Types ───────────────────────────────────────────────────

interface MovimentacaoStepDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  movimentacaoId: number | null;
  /** Default label for process button (default: 'Processar') */
  defaultProcessLabel?: string;
  /** Default label shown while submitting (default: 'Processando...') */
  defaultProcessLabelSubmitting?: string;
  /** Default tooltip for process button (default: 'Salvar e processar dados') */
  defaultProcessTooltip?: string;
  /** Whether to show Save/Process action buttons (default: true) */
  showActions?: boolean;
  /**
   * Render the inner step component.
   * Receives the ref (to attach via forwardRef) and the syncState callback (to pass as onStateChange).
   *
   * Note: the ref is NOT read during render — it is forwarded to a child via React.forwardRef.
   * The syncState callback reads ref.current inside a queueMicrotask, never synchronously during render.
   */
  children: (ref: React.RefObject<MovimentacaoStepHandler | null>, onStateChange: () => void) => ReactNode;
}

interface StepState {
  showHelp: boolean;
  hasData: boolean;
  isSubmitting: boolean;
  isReading: boolean;
  handleSave: (() => Promise<void>) | undefined;
  handleProcess: (() => Promise<void>) | undefined;
  processLabel: string;
  processLabelSubmitting: string;
  processTooltip: string;
  processIcon: 'default' | 'print' | 'process';
}

// ── Help Tooltip ────────────────────────────────────────────

const HelpTooltip = () => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      title="Clique duas vezes em um campo para editá-lo. Clique no cabeçalho da última coluna para ordenar por erros."
      arrow
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      <IconButton
        size="small"
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.dark' }
        }}
      >
        <QuestionMarkIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

// ── Process Icon Resolver ───────────────────────────────────

const ProcessIcon = ({ icon }: { icon: StepState['processIcon'] }) => {
  switch (icon) {
    case 'print':
      return <PrintIcon />;
    case 'process':
      return <DocumentScannerIcon />;
    default:
      return <CheckCircleOutlinedIcon />;
  }
};

// ── Component ───────────────────────────────────────────────

const MovimentacaoStepDialog = ({
  open,
  onClose,
  title,
  movimentacaoId,
  defaultProcessLabel = 'Processar',
  defaultProcessLabelSubmitting = 'Processando...',
  defaultProcessTooltip = 'Salvar e processar dados',
  showActions = true,
  children
}: MovimentacaoStepDialogProps) => {
  const stepRef = useRef<MovimentacaoStepHandler>(null);

  const defaultState: StepState = {
    showHelp: false,
    hasData: false,
    isSubmitting: false,
    isReading: false,
    handleSave: undefined,
    handleProcess: undefined,
    processLabel: defaultProcessLabel,
    processLabelSubmitting: defaultProcessLabelSubmitting,
    processTooltip: defaultProcessTooltip,
    processIcon: 'default'
  };

  const [state, setState] = useState<StepState>(defaultState);

  /**
   * Exposed as `onStateChange` to the step component.
   * Defers reading the imperative handle until after React commits.
   */
  const syncState = useCallback(() => {
    queueMicrotask(() => {
      const cur = stepRef.current;
      if (cur) {
        setState({
          showHelp: cur.showHelp ?? false,
          hasData: cur.hasData,
          isSubmitting: cur.isSubmitting,
          isReading: cur.isReading ?? false,
          handleSave: cur.handleSave,
          handleProcess: cur.handleProcess,
          processLabel: cur.processLabel || defaultProcessLabel,
          processLabelSubmitting: cur.processLabelSubmitting || defaultProcessLabelSubmitting,
          processTooltip: cur.processTooltip || defaultProcessTooltip,
          processIcon: cur.processIcon || 'default'
        });
      }
    });
  }, [defaultProcessLabel, defaultProcessLabelSubmitting, defaultProcessTooltip]);

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        if (state.isReading) return;
        onClose();
      }}
    >
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          {title}
          {state.showHelp && <HelpTooltip />}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {/* eslint-disable-next-line react-hooks/refs -- stepRef is forwarded to a child via React.forwardRef, not read during render */}
        {movimentacaoId && children(stepRef, syncState)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={state.isReading}>
          Fechar
        </Button>
        {showActions && state.hasData && (
          <>
            {state.handleSave && (
              <Tooltip title="Salvar e sair">
                <Button variant="outlined" endIcon={<SaveIcon />} onClick={() => state.handleSave?.()} disabled={state.isSubmitting}>
                  Salvar
                </Button>
              </Tooltip>
            )}
            {state.handleProcess && (
              <Tooltip title={state.processTooltip}>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ProcessIcon icon={state.processIcon} />}
                  onClick={() => state.handleProcess?.()}
                  disabled={state.isSubmitting}
                >
                  {state.isSubmitting ? state.processLabelSubmitting : state.processLabel}
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MovimentacaoStepDialog;
