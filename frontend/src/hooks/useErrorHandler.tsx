import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { isAxiosError } from 'axios';
import { useCallback } from 'react';
import { useDialog } from './useDialog';
import { useSnackbar } from './useSnackbar';

// ── Types ───────────────────────────────────────────────────

interface ErrorDetail {
  campo: string;
  erros: string[];
}

interface ErrorResponseData {
  message?: string | string[];
  error?: string;
  detalhes?: ErrorDetail[] | string[];
  _requestPayload?: string;
}

// ── Hook ────────────────────────────────────────────────────

export const useErrorHandler = () => {
  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const theme = useTheme();

  const showErrorDialog = useCallback(
    (message: string, detalhes: ErrorDetail[] | string[], requestPayload?: unknown) => {
      showDialog({
        title: 'Detalhes do Erro',
        content: (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {message}
            </Typography>

            <List dense disablePadding>
              {detalhes.map((item, i) => {
                if (typeof item === 'string') {
                  return (
                    // eslint-disable-next-line react/no-array-index-key -- Error details are dynamic strings without natural unique IDs
                    <ListItem key={i} sx={{ py: 0.25 }}>
                      <ListItemText primary={`• ${item}`} />
                    </ListItem>
                  );
                }
                return (
                  // eslint-disable-next-line react/no-array-index-key -- Error details are dynamic objects without natural unique IDs
                  <ListItem key={i} sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={item.campo}
                      secondary={item.erros.join('; ')}
                      slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                    />
                  </ListItem>
                );
              })}
            </List>

            {requestPayload && (
              <Accordion sx={{ mt: 2 }} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />}>
                  <Typography color="primary" variant="button">
                    Mais detalhes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{
                      position: 'relative',
                      '& .copy-btn': { opacity: 0, transition: 'opacity 0.2s' },
                      '&:hover .copy-btn': { opacity: 1 }
                    }}
                  >
                    <Tooltip title="Copiar" placement="left">
                      <IconButton
                        className="copy-btn"
                        size="small"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(requestPayload, null, 2))}
                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Typography
                      component="pre"
                      variant="caption"
                      sx={{
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        color: theme.vars?.palette.md3.onSurface,
                        maxHeight: 300,
                        overflowY: 'auto',
                        p: 1.5,
                        scrollbarGutter: 'stable',
                        scrollbarWidth: 'thin',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {JSON.stringify(requestPayload, null, 2)}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </>
        ),
        actions: [
          <Button key="close" onClick={closeDialog} variant="contained">
            Fechar
          </Button>
        ]
      });
    },
    [showDialog, closeDialog, theme]
  );

  const handleError = useCallback(
    (error: unknown) => {
      // O interceptor do Axios (utils/axios.ts) rejeita com error.response.data diretamente,
      // então o erro que chega aqui é um objeto puro { statusCode, message, detalhes },
      // não um AxiosError. Tratamos ambos os casos.

      let message = 'Erro desconhecido';
      let detalhes: ErrorDetail[] | string[] | undefined;
      let requestPayload: unknown;

      if (isAxiosError(error)) {
        // Caso raro — AxiosError puro (ex: erro de rede sem response)
        const data = error.response?.data as ErrorResponseData | undefined;
        message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || data?.error || error.message;
        detalhes = data?.detalhes;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // Objeto puro do backend (via interceptor)
        const data = error as ErrorResponseData;
        message = Array.isArray(data.message) ? data.message.join(', ') : data.message || data.error || 'Erro na requisição';
        detalhes = data.detalhes;
        if (data._requestPayload) {
          try {
            requestPayload = JSON.parse(data._requestPayload);
          } catch {
            requestPayload = data._requestPayload;
          }
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }

      const hasDetails = detalhes && detalhes.length > 0;

      showSnackbar({
        title: 'Erro na Requisição',
        message: String(message),
        severity: 'error',
        ...(hasDetails && {
          duration: 5000,
          actionLabel: 'DETALHES',
          onAction: () => showErrorDialog(String(message), detalhes!, requestPayload)
        })
      });
    },
    [showSnackbar, showErrorDialog]
  );

  return handleError;
};
