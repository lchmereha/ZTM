import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// MUI
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
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

interface TagConferida {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
}

interface TagNaoEncontrada {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
}

interface TagIgnorada {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
  ativa: boolean;
}

interface ProdutoResult {
  codigo: string;
  nome: string | null;
  quantidadeSolicitada: number;
  totalTagsProduto: number;
  conferidas: TagConferida[];
  naoEncontradas: TagNaoEncontrada[];
  ignoradas: TagIgnorada[];
}

interface RelatorioResponse {
  movimentacaoId: number;
  fazBaixa: boolean;
  totalSolicitadas: number;
  totalConferidas: number;
  totalNaoEncontradas: number;
  totalIgnoradas: number;
  produtos: ProdutoResult[];
}

// ── Props ───────────────────────────────────────────────────

interface ConferenciaRelatorioProps {
  movimentacaoId: number;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

const ConferenciaRelatorio = forwardRef<MovimentacaoStepHandler, ConferenciaRelatorioProps>(({ movimentacaoId, onStateChange }, ref) => {
  const handleError = useErrorHandler();
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch report on mount ──────────────────────────────

  useEffect(() => {
    const fetchRelatorio = async () => {
      try {
        const { data } = await axios.get<RelatorioResponse>(`${movimentacaoEndpoint}/${movimentacaoId}/conferencia/relatorio`);
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
      hasData: relatorio !== null && (relatorio.totalConferidas > 0 || relatorio.totalNaoEncontradas > 0),
      isSubmitting: false
    }),
    [relatorio]
  );

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

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

  if (!relatorio || (relatorio.totalConferidas === 0 && relatorio.totalNaoEncontradas === 0)) {
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
          Nenhuma tag conferida encontrada
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Esta movimentação não possui registros de conferência.
        </Typography>
      </Paper>
    );
  }

  // ── Derived state ─────────────────────────────────────

  const conferenciaIncompleta = relatorio.totalConferidas < relatorio.totalSolicitadas;
  const conferenciaEscopo = relatorio.totalIgnoradas > 0;

  // ── Render: Relatório ─────────────────────────────────

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────── */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6">Resultado da Conferência</Typography>
        <Chip
          icon={<CheckCircleOutlinedIcon />}
          label={`${relatorio.totalConferidas} ${relatorio.totalConferidas === 1 ? 'conferida' : 'conferidas'}`}
          color="success"
          size="small"
          variant="filled"
        />
        {relatorio.totalNaoEncontradas > 0 && (
          <Chip
            icon={<ErrorOutlinedIcon />}
            label={`${relatorio.totalNaoEncontradas} ${relatorio.totalNaoEncontradas === 1 ? 'não encontrada' : 'não encontradas'}${relatorio.fazBaixa ? ' (baixadas)' : ''}`}
            color="error"
            size="small"
            variant="filled"
          />
        )}
        {conferenciaEscopo && (
          <Chip
            icon={<VisibilityOffOutlinedIcon />}
            label={`${relatorio.totalIgnoradas} ${relatorio.totalIgnoradas === 1 ? 'ignorada' : 'ignoradas'}`}
            size="small"
            variant="outlined"
          />
        )}
      </Stack>

      {/* ── Alert: Incomplete ───────────────────────────── */}
      {conferenciaIncompleta && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Conferência incompleta</AlertTitle>
          Foram solicitadas <strong>{relatorio.totalSolicitadas}</strong> {relatorio.totalSolicitadas === 1 ? 'tag' : 'tags'} para
          conferência, mas apenas <strong>{relatorio.totalConferidas}</strong>{' '}
          {relatorio.totalConferidas === 1 ? 'foi conferida' : 'foram conferidas'}.
        </Alert>
      )}

      {/* ── Products ────────────────────────────────────── */}
      {relatorio.produtos.map((produto) => {
        const hasNaoEncontradas = produto.naoEncontradas.length > 0;
        const hasIgnoradas = produto.ignoradas.length > 0;
        const produtoIncompleto = produto.conferidas.length < produto.quantidadeSolicitada;

        return (
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
                  <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                    — {produto.nome}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ ml: 'auto', flexShrink: 0 }}>
                  {produtoIncompleto && (
                    <Chip
                      label={`${produto.conferidas.length}/${produto.quantidadeSolicitada}`}
                      size="small"
                      color="warning"
                      variant="filled"
                    />
                  )}
                  <Chip label={`${produto.conferidas.length} ✓`} size="small" color="success" variant="outlined" />
                  {hasNaoEncontradas && <Chip label={`${produto.naoEncontradas.length} ✗`} size="small" color="error" variant="outlined" />}
                  {hasIgnoradas && <Chip label={`${produto.ignoradas.length} —`} size="small" variant="outlined" />}
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {/* ── Conferidas ───────────────────── */}
              {produto.conferidas.length > 0 && (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', px: 2, pt: 1, color: 'success.main' }}>
                    Tags conferidas
                  </Typography>
                  <List dense disablePadding>
                    {produto.conferidas.map((tag) => (
                      <ListItem key={tag.id} divider>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocalOfferOutlinedIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tag.codigoRfid}
                          secondary={tag.codigoUnico ? `Único: ${tag.codigoUnico}` : undefined}
                          slotProps={{ primary: { sx: { fontFamily: 'monospace', fontSize: '0.85rem' } } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* ── Não encontradas ──────────────── */}
              {hasNaoEncontradas && (
                <>
                  {produto.conferidas.length > 0 && <Divider />}
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', px: 2, pt: 1, color: 'error.main' }}>
                    Não encontradas{relatorio.fazBaixa ? ' — baixadas por esta movimentação' : ''}
                  </Typography>
                  <List dense disablePadding>
                    {produto.naoEncontradas.map((tag) => (
                      <ListItem key={tag.id} divider>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocalOfferOutlinedIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tag.codigoRfid}
                          secondary={tag.codigoUnico ? `Único: ${tag.codigoUnico}` : undefined}
                          slotProps={{ primary: { sx: { fontFamily: 'monospace', fontSize: '0.85rem', color: 'error.main' } } }}
                        />
                        <Chip label={relatorio.fazBaixa ? 'Baixada' : 'Não encontrada'} size="small" color="error" variant="outlined" />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* ── Ignoradas ───────────────────── */}
              {hasIgnoradas && (
                <>
                  {(produto.conferidas.length > 0 || hasNaoEncontradas) && <Divider />}
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', px: 2, pt: 1, color: 'text.disabled' }}>
                    Fora do escopo da conferência
                  </Typography>
                  <List dense disablePadding>
                    {produto.ignoradas.map((tag) => (
                      <ListItem key={tag.id} divider>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocalOfferOutlinedIcon fontSize="small" color="disabled" />
                        </ListItemIcon>
                        <ListItemText
                          primary={tag.codigoRfid}
                          secondary={tag.codigoUnico ? `Único: ${tag.codigoUnico}` : undefined}
                          slotProps={{ primary: { sx: { fontFamily: 'monospace', fontSize: '0.85rem', color: 'text.disabled' } } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
});

export default ConferenciaRelatorio;
