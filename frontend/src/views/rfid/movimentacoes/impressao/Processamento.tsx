import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

// MUI
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Project
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ImportacaoItem } from 'models/importacao-item';
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

interface ProcessarResponse {
  movimentacaoId: number;
  totalTags: number;
  produtos: ProdutoResult[];
}

// ── Props ───────────────────────────────────────────────────

interface ImpressaoProcessamentoProps {
  movimentacaoId: number;
  onComplete?: () => void;
  onStateChange?: () => void;
  onSituacaoChange?: (situacao: string) => void;
}

// ── Component ───────────────────────────────────────────────

const ImpressaoProcessamento = forwardRef<MovimentacaoStepHandler, ImpressaoProcessamentoProps>(
  ({ movimentacaoId, onComplete, onStateChange, onSituacaoChange }, ref) => {
    const { showSnackbar } = useSnackbar();
    const handleError = useErrorHandler();

    const [items, setItems] = useState<ImportacaoItem[]>([]);
    const [resultado, setResultado] = useState<ProcessarResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Fetch importação items on mount ───────────────────────

    useEffect(() => {
      const fetchItems = async () => {
        try {
          const { data } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/importacao-items`);
          setItems(data);
        } catch (err) {
          handleError(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchItems();
    }, [movimentacaoId, handleError]);

    // ── Process ─────────────────────────────────────────────

    const handleProcess = useCallback(async () => {
      setIsSubmitting(true);
      try {
        const { data } = await axios.post<ProcessarResponse>(`${movimentacaoEndpoint}/${movimentacaoId}/processar`);
        setResultado(data);
        showSnackbar({
          title: 'Tags geradas com sucesso!',
          message: `${data.totalTags} ${data.totalTags === 1 ? 'tag RFID criada' : 'tags RFID criadas'} para ${data.produtos.length} ${data.produtos.length === 1 ? 'produto' : 'produtos'}.`,
          severity: 'success'
        });
      } catch (err) {
        handleError(err);
      } finally {
        setIsSubmitting(false);
      }
    }, [movimentacaoId, showSnackbar, handleError]);

    // ── Save (close dialog) ─────────────────────────────────

    const handleSave = useCallback(async () => {
      if (onComplete) onComplete();
    }, [onComplete]);

    // ── Continue to print (after processing) ─────────────────

    const handleContinueToPrint = useCallback(async () => {
      onSituacaoChange?.('PROCESSADO');
    }, [onSituacaoChange]);

    // ── Imperative Handle ───────────────────────────────────

    const hasData = items.length > 0;
    const processed = resultado !== null;

    useImperativeHandle(
      ref,
      () => ({
        handleSave: processed ? handleSave : undefined,
        handleProcess: processed ? handleContinueToPrint : hasData ? handleProcess : undefined,
        processLabel: processed ? 'Imprimir' : undefined,
        processLabelSubmitting: processed ? undefined : 'Processando...',
        processTooltip: processed ? 'Salvar e imprimir' : undefined,
        processIcon: processed ? ('print' as const) : undefined,
        hasData,
        isSubmitting
      }),
      [hasData, processed, isSubmitting, handleSave, handleProcess, handleContinueToPrint]
    );

    // Notify parent when reactive state changes
    const stateKey = `${items.length}-${isSubmitting}-${processed}`;
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

    if (items.length === 0 && !resultado) {
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
            Nenhum item de importação encontrado
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Importe uma planilha na etapa anterior.
          </Typography>
        </Paper>
      );
    }

    // ── Render: Resultado (após processamento) ──────────────

    if (resultado) {
      return (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Relatório de Tags Geradas</Typography>
            <Chip
              label={`${resultado.totalTags} ${resultado.totalTags === 1 ? 'tag' : 'tags'}`}
              color="success"
              size="small"
              variant="filled"
            />
          </Box>

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

    // ── Render: Preview (antes de processar) ─────────────────

    return (
      <Box>
        {isSubmitting && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Itens para Processamento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {items.length} {items.length === 1 ? 'item será processado' : 'itens serão processados'}. Clique em <strong>Processar</strong>{' '}
          para gerar as tags RFID.
        </Typography>

        {items.map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 80 }}>
              {item.codigo}
            </Typography>
            {item.nome && (
              <Typography variant="body2" color="text.secondary">
                {item.nome}
              </Typography>
            )}
            <Chip label={`Qtd: ${item.quantidade}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
            {item.codigoUnico && <Chip label={`Único: ${item.codigoUnico}`} size="small" variant="outlined" />}
          </Paper>
        ))}
      </Box>
    );
  }
);

export default ImpressaoProcessamento;
