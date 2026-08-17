import ClearIcon from '@mui/icons-material/Clear';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';

export interface DataTableFilterDialogProps<T extends object> {
  open: boolean;
  onClose: () => void;
  onApply: (filters: T) => void;
  appliedFilters: T;
  emptyFilters: T;
  renderForm: (draft: T, setDraft: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

/**
 * Inner component that resets its draft state whenever the key changes.
 * This avoids calling setState inside useEffect to sync draft with appliedFilters.
 */
const DataTableFilterDialogInner = <T extends object>({
  onClose,
  onApply,
  appliedFilters,
  emptyFilters,
  renderForm,
  title = 'Filtros Avançados',
  maxWidth = 'sm'
}: Omit<DataTableFilterDialogProps<T>, 'open'>) => {
  const [draft, setDraft] = useState<T>({ ...appliedFilters });

  const handleClear = () => {
    setDraft({ ...emptyFilters });
  };

  const handleApply = () => {
    onApply({ ...draft });
  };

  return (
    <Dialog open onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{renderForm(draft, setDraft)}</DialogContent>
      <DialogActions>
        <Button onClick={handleClear} color="inherit" startIcon={<ClearIcon />}>
          Limpar
        </Button>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleApply} variant="contained">
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Wrapper that only mounts the inner component when `open` is true.
 * This ensures that the inner component re-initializes its draft state
 * from `appliedFilters` each time the dialog opens, without needing
 * a useEffect to synchronize state.
 */
const DataTableFilterDialog = <T extends object>({ open, ...rest }: DataTableFilterDialogProps<T>) => {
  if (!open) return null;
  return <DataTableFilterDialogInner {...rest} />;
};

export default DataTableFilterDialog;
