import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Project
import { useErrorHandler } from 'hooks/useErrorHandler';
import { movimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';
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

interface RelatorioResponse {
  movimentacaoId: number;
  totalTags: number;
  produtos: ProdutoResult[];
}

// ── Props ───────────────────────────────────────────────────

interface AssociacaoRelatorioProps {
  movimentacaoId: number;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

const AssociacaoRelatorio = forwardRef<MovimentacaoStepHandler, AssociacaoRelatorioProps>(({ movimentacaoId, onStateChange }, ref) => {
  const handleError = useErrorHandler();
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch report on mount ──────────────────────────────

  useEffect(() => {
    const fetchRelatorio = async () => {
      try {
        const { data } = await axios.get<RelatorioResponse>(`${movimentacaoEndpoint}/${movimentacaoId}/associacao/relatorio`);
        setRelatorio(data);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelatorio();
  }, [movimentacaoId, handleError]);

  // ── Imperative Handle ─────────────────────────────────

  useImperativeHandle(
    ref,
    () => ({
      hasData: relatorio !== null && relatorio.totalTags > 0,
      isSubmitting: false
    }),
    [relatorio]
  );

  // Stable ref for the callback to avoid re-triggering the effect
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Notify parent AFTER render so the imperative handle is already updated
  useEffect(() => {
    if (!isLoading) {
      onStateChangeRef.current?.();
    }
  }, [isLoading]);

  // ── Render: Loading ───────────────────────────────────

  if (isLoading) {
    return <LinearProgress sx={{ borderRadius: 1 }} />;
  }

  // ── Render: Empty ─────────────────────────────────────

  if (!relatorio || relatorio.totalTags === 0) {
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
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Nenhuma tag associada encontrada
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Esta movimentação não possui tags associadas a produtos.
        </Typography>
      </Paper>
    );
  }

  // ── Render: Relatório ─────────────────────────────────

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">Tags Associadas</Typography>
        <Chip
          label={`${relatorio.totalTags} ${relatorio.totalTags === 1 ? 'tag' : 'tags'}`}
          color="success"
          size="small"
          variant="filled"
        />
        <Chip
          label={`${relatorio.produtos.length} ${relatorio.produtos.length === 1 ? 'produto' : 'produtos'}`}
          size="small"
          variant="outlined"
        />
      </Stack>

      {relatorio.produtos.map((produto) => (
        <Accordion
          key={produto.codigo}
          defaultExpanded={relatorio.produtos.length <= 5}
          sx={{ '&::before': { display: 'none' }, borderBottom: 1, borderColor: 'divider', '&.Mui-expanded': { borderBottom: 0 } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {produto.codigo}
              </Typography>
              {produto.nome && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  — {produto.nome}
                </Typography>
              )}
              <Chip
                label={`${produto.tags.length} ${produto.tags.length === 1 ? 'tag' : 'tags'}`}
                size="small"
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Stack>
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
});

export default AssociacaoRelatorio;
