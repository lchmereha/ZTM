import { createContext, useCallback, useState, type ReactNode } from 'react';

// MUI
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Portal from '@mui/material/Portal';
import Snackbar from '@mui/material/Snackbar';
import { useTheme } from '@mui/material/styles';

// Icons
import CloseIcon from '@mui/icons-material/Close';

// ── Types ───────────────────────────────────────────────────

export type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

export interface SnackbarOptions {
  title?: string | null;
  message?: string | null;
  severity?: SnackbarSeverity;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions) => void;
}

// ── Context ─────────────────────────────────────────────────

export const SnackbarContext = createContext<SnackbarContextType | null>(null);

// ── Provider ────────────────────────────────────────────────

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SnackbarOptions>({});

  const showSnackbar = useCallback((opts: SnackbarOptions) => {
    setOptions({
      severity: 'info',
      duration: 3000,
      ...opts
    });
    setOpen(true);
  }, []);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const { title, message, severity = 'info', duration, actionLabel, onAction } = options;

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Portal>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={duration}
          disableWindowBlurListener
          onClose={handleClose}
          open={open}
          sx={{ mt: 4, maxWidth: '50%' }}
        >
          <Alert
            severity={severity}
            variant="filled"
            sx={{
              width: '100%',
              color: theme.vars?.palette[severity].contrastText,
              '& .MuiAlert-icon': {
                color: theme.vars?.palette[severity].contrastText
              }
            }}
            action={
              <>
                {actionLabel && onAction && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      handleClose();
                      onAction();
                    }}
                  >
                    {actionLabel}
                  </Button>
                )}
                <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
          >
            {title && title.trim() !== '' && <AlertTitle>{title}</AlertTitle>}
            {message}
          </Alert>
        </Snackbar>
      </Portal>
    </SnackbarContext.Provider>
  );
};
