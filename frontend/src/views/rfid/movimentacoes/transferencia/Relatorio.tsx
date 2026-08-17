import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InventoryIcon from '@mui/icons-material/Inventory';

// MUI
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
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

interface TagTransferida {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
}

interface ProdutoResult {
  codigo: string;
  nome: string | null;
  quantidadeSolicitada: number;
  posicaoOrigem: string | null;
  posicaoDestino: string | null;
  transferidas: TagTransferida[];
}

interface RelatorioResponse {
  movimentacaoId: number;
  totalSolicitadas: number;
  totalTransferidas: number;
  produtos: ProdutoResult[];
}

interface MovimentacaoInfo {
  filial?: { nome: string };
  filialDestino?: { nome: string };
}

// ── Props ───────────────────────────────────────────────────

interface TransferenciaRelatorioProps {
  movimentacaoId: number;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

const TransferenciaRelatorio = forwardRef<MovimentacaoStepHandler, TransferenciaRelatorioProps>(
  ({ movimentacaoId, onStateChange }, ref) => {
    const handleError = useErrorHandler();
    const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
    const [movimentacao, setMovimentacao] = useState<MovimentacaoInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Fetch report on mount ──────────────────────────────

    useEffect(() => {
      const fetchRelatorio = async () => {
        try {
          const [relatorioRes, movRes] = await Promise.all([
            axios.get<RelatorioResponse>(`${movimentacaoEndpoint}/${movimentacaoId}/transferencia/relatorio`),
            axios.get(`${movimentacaoEndpoint}/${movimentacaoId}`)
          ]);
          setRelatorio(relatorioRes.data);
          setMovimentacao(Array.isArray(movRes.data) ? movRes.data[0] : movRes.data);
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
        hasData: relatorio !== null && relatorio.totalTransferidas > 0,
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

    if (!relatorio || relatorio.totalTransferidas === 0) {
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
            Nenhuma tag transferida encontrada
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Esta movimentação não possui registros de transferência.
          </Typography>
        </Paper>
      );
    }

    // ── Derived state ─────────────────────────────────────

    const transferenciaIncompleta = relatorio.totalTransferidas < relatorio.totalSolicitadas;

    // ── Render: Relatório ─────────────────────────────────

    return (
      <Box>
        {/* ── Header ──────────────────────────────────────── */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h6">Resultado da Transferência</Typography>
          <Chip
            icon={<CheckCircleOutlinedIcon />}
            label={`${relatorio.totalTransferidas} ${relatorio.totalTransferidas === 1 ? 'transferida' : 'transferidas'}`}
            color="success"
            size="small"
            variant="filled"
          />
        </Stack>

        {/* ── Origem / Destino ────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', gap: 4, bgcolor: 'background.default' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Origem
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {movimentacao?.filial?.nome || 'Não informada'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Destino
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {movimentacao?.filialDestino?.nome || 'Não informada'}
            </Typography>
          </Box>
        </Paper>

        {/* ── Alert: Incomplete ───────────────────────────── */}
        {transferenciaIncompleta && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
            <AlertTitle>Transferência incompleta</AlertTitle>
            Foram solicitadas <strong>{relatorio.totalSolicitadas}</strong> {relatorio.totalSolicitadas === 1 ? 'tag' : 'tags'} para
            transferência, mas apenas <strong>{relatorio.totalTransferidas}</strong>{' '}
            {relatorio.totalTransferidas === 1 ? 'foi transferida' : 'foram transferidas'}.
          </Alert>
        )}

        {/* ── Products ────────────────────────────────────── */}
        {relatorio.produtos.map((produto) => {
          const produtoIncompleto = produto.transferidas.length < produto.quantidadeSolicitada;

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
                  {(produto.posicaoOrigem || produto.posicaoDestino) && (
                    <Chip
                      icon={<InventoryIcon />}
                      label={`${produto.posicaoOrigem || 'Sem posição'} → ${produto.posicaoDestino || 'Sem posição'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                  <Stack direction="row" spacing={0.5} sx={{ ml: 'auto', flexShrink: 0 }}>
                    {produtoIncompleto && (
                      <Chip
                        label={`${produto.transferidas.length}/${produto.quantidadeSolicitada}`}
                        size="small"
                        color="warning"
                        variant="filled"
                      />
                    )}
                    <Chip label={`${produto.transferidas.length} ✓`} size="small" color="success" variant="outlined" />
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {/* ── Transferidas ───────────────────── */}
                {produto.transferidas.length > 0 && (
                  <>
                    <List dense disablePadding>
                      {produto.transferidas.map((tag, idx) => (
                        <ListItem
                          key={tag.id}
                          divider={idx < produto.transferidas.length - 1}
                          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleOutlinedIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                                {tag.codigoRfid}
                              </Typography>
                            }
                            secondary={
                              tag.codigoUnico && (
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, alignItems: 'center' }}>
                                  <LocalOfferOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {tag.codigoUnico}
                                  </Typography>
                                </Stack>
                              )
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                {produto.transferidas.length === 0 && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.disabled">
                      Nenhuma tag transferida para este produto.
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  }
);

export default TransferenciaRelatorio;
