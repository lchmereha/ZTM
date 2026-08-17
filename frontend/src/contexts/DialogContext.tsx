import { createContext, useCallback, useState, type ReactNode } from 'react';

// MUI
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Icons
import CloseIcon from '@mui/icons-material/Close';

// ── Types ───────────────────────────────────────────────────

export interface DialogOptions {
  title?: string | ReactNode | null | undefined;
  dismissable?: boolean | undefined;
  dividers?: boolean | undefined;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false | undefined;
  fullWidth?: boolean | undefined;
  content?: string | ReactNode | null | undefined;
  actions?: ReactNode[] | null | undefined;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

// ── Context ─────────────────────────────────────────────────

export const DialogContext = createContext<DialogContextType | null>(null);

// ── Provider ────────────────────────────────────────────────

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({});

  const showDialog = useCallback((opts: DialogOptions) => {
    setOptions({
      dismissable: true,
      ...opts
    });
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClose = (_?: object, reason?: string) => {
    if (options.dismissable === false && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    closeDialog();
  };

  const { title, dismissable, dividers = true, maxWidth = 'sm', fullWidth = true, content, actions } = options;

  const hasTitleText = typeof title === 'string' ? title.trim() !== '' : !!title;
  const renderTitle = hasTitleText || dismissable;

  return (
    <DialogContext.Provider value={{ showDialog, closeDialog }}>
      {children}
      <Dialog fullWidth={fullWidth} maxWidth={maxWidth} onClose={handleClose} open={open}>
        {renderTitle && (
          <>
            <DialogTitle>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                {title}
                {dismissable && (
                  <IconButton aria-label="close" onClick={closeDialog} size="small">
                    <CloseIcon />
                  </IconButton>
                )}
              </Stack>
            </DialogTitle>
          </>
        )}

        {content && (
          <>
            <DialogContent dividers={dividers}>
              {typeof content === 'string' ? <Typography variant="body1">{content}</Typography> : content}
            </DialogContent>
            {actions && actions.length > 0}
          </>
        )}

        {actions && actions.length > 0 && (
          <DialogActions>
            {actions.map((action, index) => (
              // eslint-disable-next-line react/no-array-index-key -- Actions are ReactNode[] without natural unique keys
              <Box key={index}>{action}</Box>
            ))}
          </DialogActions>
        )}
      </Dialog>
    </DialogContext.Provider>
  );
};
