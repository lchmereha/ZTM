import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// MUI
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Project
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import { movimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// Shared
import type { MovimentacaoStepHandler } from '../shared/types';

// ── Types ───────────────────────────────────────────────────

interface TagResult {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
  dataValidade: string | null;
  lote: string | null;
  dataFabricacao: string | null;
}

interface ProdutoResult {
  codigo: string;
  nome: string | null;
  tags: TagResult[];
}

interface TagsProcessadasResponse {
  movimentacaoId: number;
  totalTags: number;
  produtos: ProdutoResult[];
}

interface ImprimirResponse {
  movimentacaoId: number;
  totalImpressas: number;
  produtosIgnorados: string[];
  equipamento: string;
}

// ── Props ───────────────────────────────────────────────────

interface ImpressaoResultadoProps {
  movimentacaoId: number;
  finalizado?: boolean;
  onComplete?: () => void;
  onStateChange?: () => void;
  onSituacaoChange?: (situacao: string) => void;
}

// ── Component ───────────────────────────────────────────────

const ImpressaoResultado = forwardRef<MovimentacaoStepHandler, ImpressaoResultadoProps>(
  ({ movimentacaoId, finalizado = false, onComplete, onStateChange, onSituacaoChange }, ref) => {
    const { showSnackbar } = useSnackbar();
    const { showDialog, closeDialog } = useDialog();
    const handleError = useErrorHandler();

    const [resultado, setResultado] = useState<TagsProcessadasResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [printResult, setPrintResult] = useState<ImprimirResponse | null>(null);

    // ── Fetch processed tags on mount ──────────────────────

    useEffect(() => {
      const fetchTags = async () => {
        try {
          const { data } = await axios.get<TagsProcessadasResponse>(`${movimentacaoEndpoint}/${movimentacaoId}/tags-processadas`);
          setResultado(data);
        } catch (err) {
          handleError(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTags();
    }, [movimentacaoId, handleError]);

    // ── Finalizar (confirmar impressão OK) ───────────────────

    const finalizarMovimentacao = useCallback(async () => {
      try {
        await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/finalizar`);
        showSnackbar({
          title: 'Movimentação finalizada!',
          message: 'Etiquetas impressas com sucesso.',
          severity: 'success'
        });
        onSituacaoChange?.('FINALIZADO');
        onComplete?.();
      } catch (err) {
        handleError(err);
      }
    }, [movimentacaoId, showSnackbar, handleError, onSituacaoChange, onComplete]);

    // ── Post-print confirmation dialog ──────────────────────

    const showPrintConfirmation = useCallback(
      (result: ImprimirResponse) => {
        setPrintResult(result);

        showDialog({
          title: 'Impressão enviada',
          content: (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {result.totalImpressas} {result.totalImpressas === 1 ? 'etiqueta enviada' : 'etiquetas enviadas'} para o equipamento{' '}
                {result.equipamento}.
              </Typography>
              {result.produtosIgnorados.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Os seguintes produtos foram ignorados por não possuírem etiqueta vinculada:{' '}
                  <strong>{result.produtosIgnorados.join(', ')}</strong>
                </Alert>
              )}
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                As etiquetas foram impressas corretamente?
              </Typography>
            </Box>
          ),
          actions: [
            <Button
              key="retry"
              color="inherit"
              startIcon={<ErrorOutlinedIcon />}
              onClick={() => {
                closeDialog();
                // User stays on same screen — can click "Imprimir" again
              }}
            >
              Não, tentar novamente
            </Button>,
            <Button
              key="confirm"
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlinedIcon />}
              onClick={async () => {
                closeDialog();
                await finalizarMovimentacao();
              }}
            >
              Sim, finalizar
            </Button>
          ],
          dismissable: false,
          maxWidth: 'sm'
        });
      },
      [showDialog, closeDialog, finalizarMovimentacao]
    );

    // ── Print ───────────────────────────────────────────────

    const handlePrint = useCallback(async () => {
      setIsSubmitting(true);
      try {
        const { data } = await axios.post<ImprimirResponse>(`${movimentacaoEndpoint}/${movimentacaoId}/imprimir`);
        if (finalizado) {
          showSnackbar({
            title: 'Reimpressão enviada',
            message: `${data.totalImpressas} ${data.totalImpressas === 1 ? 'etiqueta enviada' : 'etiquetas enviadas'} para o equipamento ${data.equipamento}.`,
            severity: 'success'
          });
        } else {
          showPrintConfirmation(data);
        }
      } catch (err) {
        handleError(err);
      } finally {
        setIsSubmitting(false);
      }
    }, [movimentacaoId, finalizado, showPrintConfirmation, showSnackbar, handleError]);

    // ── Imperative Handle ───────────────────────────────────

    const hasData = resultado !== null && resultado.totalTags > 0;

    useImperativeHandle(
      ref,
      () => ({
        handleProcess: hasData ? handlePrint : undefined,
        processLabel: finalizado ? 'Reimprimir' : 'Imprimir',
        processLabelSubmitting: 'Enviando...',
        processTooltip: finalizado ? 'Reimprimir etiquetas' : 'Salvar e imprimir',
        processIcon: 'print' as const,
        hasData,
        isSubmitting
      }),
      [hasData, isSubmitting, handlePrint, finalizado]
    );

    // Notify parent when reactive state changes
    const stateKey = `${resultado?.totalTags}-${isSubmitting}`;
    const prevStateKey = useRef(stateKey);
    useEffect(() => {
      if (prevStateKey.current !== stateKey) {
        prevStateKey.current = stateKey;
        onStateChange?.();
      }
    }, [stateKey, onStateChange]);

    // ── Render: Loading ─────────────────────────────────────

    if (isLoading) {
      return <LinearProgress sx={{ borderRadius: 1 }} />;
    }

    // ── Render: Empty ───────────────────────────────────────

    if (!resultado || resultado.totalTags === 0) {
      return (
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            gap: 1,
            borderStyle: 'dashed'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Nenhuma tag processada encontrada
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Verifique o processamento desta movimentação.
          </Typography>
        </Paper>
      );
    }

    // ── Render: Relatório ───────────────────────────────────

    return (
      <Box>
        {isSubmitting && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Relatório de Tags Geradas</Typography>
          <Chip
            label={`${resultado.totalTags} ${resultado.totalTags === 1 ? 'tag' : 'tags'}`}
            color="success"
            size="small"
            variant="filled"
          />
        </Box>

        {printResult && printResult.produtosIgnorados.length > 0 && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
            Produtos sem etiqueta vinculada (ignorados na última impressão): <strong>{printResult.produtosIgnorados.join(', ')}</strong>
          </Alert>
        )}

        {resultado.produtos.map((produto) => (
          <Accordion
            key={produto.codigo}
            defaultExpanded={resultado.produtos.length <= 5}
            sx={{ '&::before': { display: 'none' }, borderBottom: 1, borderColor: 'divider', '&.Mui-expanded': { borderBottom: 0 } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {produto.codigo}
                </Typography>
                {produto.nome && (
                  <Typography variant="body2" color="text.secondary">
                    — {produto.nome}
                  </Typography>
                )}
                <Chip
                  label={`${produto.tags.length} ${produto.tags.length === 1 ? 'tag' : 'tags'}`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 'auto' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense disablePadding>
                {produto.tags.map((tag) => (
                  <ListItem key={tag.id} divider>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <LocalOfferOutlinedIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={tag.codigoRfid}
                      secondary={
                        [
                          tag.codigoUnico && `Único: ${tag.codigoUnico}`,
                          tag.lote && `Lote: ${tag.lote}`,
                          tag.dataValidade && `Validade: ${new Date(tag.dataValidade).toLocaleDateString('pt-BR')}`,
                          tag.dataFabricacao && `Fabricação: ${new Date(tag.dataFabricacao).toLocaleDateString('pt-BR')}`
                        ]
                          .filter(Boolean)
                          .join(' | ') || undefined
                      }
                      slotProps={{ primary: { sx: { fontFamily: 'monospace', fontSize: '0.85rem' } } }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }
);

export default ImpressaoResultado;
