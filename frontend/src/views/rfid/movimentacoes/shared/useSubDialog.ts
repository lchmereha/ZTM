import { useCallback, useState } from 'react';
import type { SituacaoMovimentacao } from 'models/enums';

// ── Types ───────────────────────────────────────────────────

interface SubDialogState {
  open: boolean;
  movimentacaoId: number | null;
  situacao: SituacaoMovimentacao;
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Encapsulates the open/close state for a sub-dialog (Impressão, Leitura, Associação, etc.).
 * Replaces the repeated pattern of [open, setOpen] + [movId, setMovId] + [situacao, setSituacao].
 */
export function useSubDialog(onAfterClose?: () => void) {
  const [state, setState] = useState<SubDialogState>({
    open: false,
    movimentacaoId: null,
    situacao: 'CRIADO'
  });

  const openDialog = useCallback((movId: number, situacao?: string) => {
    setState({
      open: true,
      movimentacaoId: movId,
      situacao: (situacao as SituacaoMovimentacao) || 'CRIADO'
    });
  }, []);

  const closeDialog = useCallback(() => {
    setState({ open: false, movimentacaoId: null, situacao: 'CRIADO' });
    onAfterClose?.();
  }, [onAfterClose]);

  return { ...state, openDialog, closeDialog };
}
