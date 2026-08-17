import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

// MUI
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// Project
import Button from '@mui/material/Button';
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import { type RfidTagWithCounter } from 'services/rfid/types';
import { movimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';
import RfidReaderPanel, { type RfidReaderPanelHandle } from '../shared/RfidReaderPanel';
import type { MovimentacaoStepHandler } from '../shared/types';

// ── Types ───────────────────────────────────────────────────

interface ProdutoAssociacao {
  importacaoItemId: number;
  idProduto: number | null;
  codigo: string;
  nome: string;
  unidadeMedida: string;
  categoria: string;
  quantidadeEsperada: number;
  tagsAssociadas: number;
}

interface EquipamentoInfo {
  ipConexao: string;
  portaConexao: string;
  exibeConexaoSocket: boolean;
}

// ── Props ───────────────────────────────────────────────────

interface AssociacaoLeituraProps {
  movimentacaoId: number;
  onComplete?: () => void;
  onStateChange?: () => void;
  onSituacaoChange?: (situacao: string) => void;
  finalizado?: boolean;
}

// ── Component ───────────────────────────────────────────────

const AssociacaoLeitura = forwardRef<MovimentacaoStepHandler, AssociacaoLeituraProps>(
  ({ movimentacaoId, onComplete, onStateChange, onSituacaoChange, finalizado = false }, ref) => {
    const theme = useTheme();
    const { showSnackbar } = useSnackbar();
    const { showDialog, closeDialog } = useDialog();
    const handleError = useErrorHandler();

    // ── State ─────────────────────────────────────────────────
    const readerRef = useRef<RfidReaderPanelHandle>(null);
    const [produtos, setProdutos] = useState<ProdutoAssociacao[]>([]);
    const [equipamento, setEquipamento] = useState<EquipamentoInfo | null>(null);
    const [tags, setTags] = useState<RfidTagWithCounter[]>([]);
    const [isReading, setIsReading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ── Derived ───────────────────────────────────────────────

    // Total NEW tags needed across all products (ignoring already-associated tags)
    const totalNeeded = useMemo(() => produtos.reduce((acc, p) => acc + p.quantidadeEsperada, 0), [produtos]);

    // Map read tags to products: fill each product until its expected quantity is met
    const tagAssignments = useMemo(() => {
      const assignments = new Map<number, string[]>(); // idProduto → EPCs
      const assignedTags: { epc: string; produtoId: number; produtoCodigo: string }[] = [];
      const unassignedTags: string[] = [];

      let tagIndex = 0;
      const allTags = tags;
      for (const produto of produtos) {
        if (!produto.idProduto) continue;
        const needed = produto.quantidadeEsperada;
        if (needed <= 0) continue;

        const epcs: string[] = [];
        for (let i = 0; i < needed && tagIndex < allTags.length; i++, tagIndex++) {
          epcs.push(allTags[tagIndex].tag.codigoRfid);
          assignedTags.push({
            epc: allTags[tagIndex].tag.codigoRfid,
            produtoId: produto.idProduto,
            produtoCodigo: produto.codigo
          });
        }
        assignments.set(produto.idProduto, epcs);
      }

      // Any remaining tags are unassigned (excess)
      for (let i = tagIndex; i < allTags.length; i++) {
        unassignedTags.push(allTags[i].tag.codigoRfid);
      }

      // Build O(1) lookup structures for renderTagRow
      const assignedTagSet = new Map<string, string>();
      for (const t of assignedTags) {
        assignedTagSet.set(t.epc, t.produtoCodigo);
      }
      const unassignedSet = new Set(unassignedTags);

      return { assignments, assignedTags, unassignedTags, assignedTagSet, unassignedSet };
    }, [tags, produtos]);

    const totalAssigned = tagAssignments.assignedTags.length;
    const isComplete = totalAssigned === totalNeeded && totalNeeded > 0;
    const hasExcess = tagAssignments.unassignedTags.length > 0;
    const canFinalize = isComplete && !hasExcess && !isReading && !finalizado;

    // ── Fetch data on mount ───────────────────────────────────

    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch movimentação for equipment info
          const { data: movData } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}`);
          const record = Array.isArray(movData) ? movData[0] : movData;
          if (record.equipamento) {
            setEquipamento({
              ipConexao: record.equipamento.ipConexao || '',
              portaConexao: String(record.equipamento.portaConexao || '8080'),
              exibeConexaoSocket: record.equipamento.exibeConexaoSocket ?? false
            });
          }

          // Fetch products for association
          const { data: prodData } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/associacao/produtos`);
          setProdutos(Array.isArray(prodData) ? prodData : []);
        } catch (err) {
          handleError(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [movimentacaoId, handleError]);

    // ── Submit ────────────────────────────────────────────────

    const handleConcluir = useCallback(async () => {
      if (!canFinalize) return;

      showDialog({
        dividers: false,
        title: 'Confirmar Associação',
        content: `Associar ${totalAssigned} ${totalAssigned === 1 ? 'tag' : 'tags'} a ${produtos.filter((p) => (tagAssignments.assignments.get(p.idProduto!) ?? []).length > 0).length} ${produtos.length === 1 ? 'produto' : 'produtos'}? Esta ação irá criar os registros de tag RFID e finalizar a movimentação.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            variant="contained"
            color="primary"
            startIcon={<CheckCircleOutlinedIcon />}
            onClick={async () => {
              closeDialog();
              setIsSubmitting(true);
              try {
                const allTags = tagAssignments.assignedTags.map((t) => ({
                  idProduto: t.produtoId,
                  codigoRfid: t.epc
                }));

                const BATCH_SIZE = 100;

                if (allTags.length > BATCH_SIZE) {
                  // Batch mode: send in chunks then conclude
                  showDialog({
                    title: 'Enviando tags...',
                    content: (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress variant="determinate" value={0} id="batch-progress-bar" />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }} id="batch-progress-text">
                          0 / {allTags.length}
                        </Typography>
                      </Box>
                    ),
                    actions: [],
                    dismissable: false,
                    maxWidth: 'xs'
                  });

                  try {
                    for (let i = 0; i < allTags.length; i += BATCH_SIZE) {
                      const batch = allTags.slice(i, i + BATCH_SIZE);
                      await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/associacao/lotes`, { tags: batch });
                      const sent = Math.min(i + BATCH_SIZE, allTags.length);
                      const pct = Math.round((sent / allTags.length) * 100);
                      const bar = document
                        .getElementById('batch-progress-bar')
                        ?.querySelector('[role="progressbar"]') as HTMLElement | null;
                      const text = document.getElementById('batch-progress-text');
                      if (bar) bar.style.transform = `translateX(-${100 - pct}%)`;
                      if (text) text.textContent = `${sent} / ${allTags.length}`;
                    }

                    const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/associacao/concluir-lotes`);
                    closeDialog();

                    showSnackbar({
                      title: 'Associação concluída!',
                      message: `${data.totalTags} ${data.totalTags === 1 ? 'tag foi associada' : 'tags foram associadas'} com sucesso.`,
                      severity: 'success'
                    });
                  } catch (batchErr) {
                    // Clean up server-side cache on error
                    try {
                      await axios.delete(`${movimentacaoEndpoint}/${movimentacaoId}/lotes`);
                    } catch {
                      /* ignore cleanup error */
                    }
                    closeDialog();
                    throw batchErr;
                  }
                } else {
                  // Small payload: send directly to original endpoint
                  const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/associacao/concluir`, { tags: allTags });

                  showSnackbar({
                    title: 'Associação concluída!',
                    message: `${data.totalTags} ${data.totalTags === 1 ? 'tag foi associada' : 'tags foram associadas'} com sucesso.`,
                    severity: 'success'
                  });
                }

                onSituacaoChange?.('FINALIZADO');
                onComplete?.();
              } catch (err) {
                handleError(err);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            Confirmar Associação
          </Button>
        ],
        dismissable: false,
        maxWidth: 'sm'
      });
    }, [
      canFinalize,
      totalAssigned,
      produtos,
      tagAssignments,
      movimentacaoId,
      showDialog,
      closeDialog,
      showSnackbar,
      handleError,
      onSituacaoChange,
      onComplete
    ]);

    // ── Imperative Handle ────────────────────────────────────

    const hasData = tags.length > 0 || finalizado;

    useImperativeHandle(
      ref,
      () => ({
        handleProcess: canFinalize ? handleConcluir : undefined,
        processLabel: 'Concluir Associação',
        processLabelSubmitting: 'Processando...',
        processTooltip: hasExcess
          ? 'Há tags em excesso. Remova as tags extras.'
          : !isComplete
            ? `Leia mais tags. ${totalAssigned}/${totalNeeded} lidas.`
            : 'Concluir a associação de tags aos produtos',
        hasData,
        isSubmitting,
        isReading
      }),
      [canFinalize, handleConcluir, hasExcess, isComplete, totalAssigned, totalNeeded, hasData, isSubmitting, isReading]
    );

    // Notify parent of state changes
    const stateKey = `${tags.length}-${isReading}-${isSubmitting}-${isLoading}`;
    const prevStateKey = useRef(stateKey);
    useEffect(() => {
      if (prevStateKey.current !== stateKey) {
        prevStateKey.current = stateKey;
        onStateChange?.();
      }
    }, [stateKey, onStateChange]);

    // ── Custom tag row renderer ──────────────────────────────

    const renderTagRow = useCallback(
      (item: RfidTagWithCounter, idx: number) => {
        const epc = item.tag.codigoRfid;
        const assignmentSet = tagAssignments.assignedTagSet;
        const assignment = assignmentSet?.get(epc);
        const isUnassigned = tagAssignments.unassignedSet?.has(epc) ?? false;

        return (
          <Stack
            key={epc}
            direction="row"
            sx={{
              px: 1,
              py: 0.5,
              bgcolor: isUnassigned
                ? `color-mix(in srgb, ${theme.palette.error.light} 20%, transparent)`
                : idx % 2 === 0
                  ? 'transparent'
                  : theme.palette.action.hover,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: isUnassigned ? `color-mix(in srgb, ${theme.palette.error.light} 30%, transparent)` : theme.palette.action.selected
              }
            }}
            onClick={() => navigator.clipboard.writeText(epc)}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontFamily: 'monospace',
                flex: 1,
                color: isUnassigned ? theme.palette.error.main : 'inherit',
                fontWeight: isUnassigned ? 700 : 400
              }}
            >
              {epc}
              {isUnassigned && (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: theme.palette.error.main }}>
                  (excedente)
                </Typography>
              )}
              {assignment && (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: theme.palette.success.main }}>
                  → {assignment}
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', width: 70, textAlign: 'right', fontSize: 12 }}>
              {item.tag.rssi}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
              {item.count}
            </Typography>
          </Stack>
        );
      },
      [tagAssignments, theme]
    );

    // ── Render: Loading ─────────────────────────────────────

    if (isLoading) {
      return <LinearProgress sx={{ borderRadius: 1 }} />;
    }

    // ── Render: No equipment ────────────────────────────────

    if (!equipamento || !equipamento.ipConexao) {
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
            Equipamento sem conexão configurada
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Configure o IP e porta de conexão do equipamento para iniciar a leitura.
          </Typography>
        </Paper>
      );
    }

    // ── Render: No products ─────────────────────────────────

    if (produtos.length === 0) {
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
            Nenhum produto de importação encontrado
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Importe uma planilha na etapa anterior.
          </Typography>
        </Paper>
      );
    }

    // ── Extra actions for RfidReaderPanel ─────────────────────

    const extraActions =
      !isReading && tags.length > 0 && canFinalize ? (
        <Tooltip title="Concluir associação">
          <span>
            <IconButton
              color="success"
              onClick={handleConcluir}
              disabled={isSubmitting}
              sx={{ bgcolor: theme.palette.success.light + '22' }}
            >
              <CheckCircleOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      ) : undefined;

    // ── Render ────────────────────────────────────────────────

    return (
      <Box>
        {/* ── Progress Summary ──────────────────────────────── */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: isComplete ? 'md3.primaryContainer' : hasExcess ? 'md3.errorContainer' : 'md3.surfaceContainerHigh'
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Progresso da Associação
            </Typography>
            <Chip
              label={`${totalAssigned} / ${totalNeeded} tags`}
              color={isComplete ? 'success' : hasExcess ? 'error' : 'default'}
              size="small"
              variant="filled"
            />
            {hasExcess && (
              <Chip label={`${tagAssignments.unassignedTags.length} excedente(s)`} color="error" size="small" variant="outlined" />
            )}
            {finalizado && <Chip label="Finalizado" color="success" size="small" variant="filled" />}
          </Stack>
          {!finalizado && (
            <LinearProgress
              variant="determinate"
              value={totalNeeded > 0 ? Math.min(100, (totalAssigned / totalNeeded) * 100) : 0}
              sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
              color={isComplete ? 'success' : hasExcess ? 'error' : 'primary'}
            />
          )}
        </Paper>

        {/* ── Product Cards ─────────────────────────────────── */}
        <Box>
          {produtos.map((produto) => {
            const assignedEpcs = produto.idProduto ? (tagAssignments.assignments.get(produto.idProduto) ?? []) : [];
            const isFull = assignedEpcs.length >= produto.quantidadeEsperada;

            return (
              <Accordion
                defaultExpanded={produtos.length <= 3}
                disableGutters
                key={produto.importacaoItemId}
                slotProps={{ transition: { unmountOnExit: true } }}
                sx={{
                  '&::before': { display: 'none' },
                  borderBottom: 1,
                  borderColor: 'divider'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%', mr: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {produto.codigo}
                    </Typography>
                    {produto.nome && (
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                        — {produto.nome}
                      </Typography>
                    )}
                    <Chip
                      label={`${assignedEpcs.length} / ${produto.quantidadeEsperada}`}
                      size="small"
                      color={isFull ? 'success' : 'default'}
                      variant={isFull ? 'filled' : 'outlined'}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pl: 2, pr: 2, pb: 1 }}>
                  {/* Summary of existing tags */}
                  {produto.tagsAssociadas > 0 && (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <LocalOfferOutlinedIcon fontSize="small" color="disabled" />
                      <Typography variant="body2" color="text.disabled">
                        {produto.tagsAssociadas} {produto.tagsAssociadas === 1 ? 'tag já associada' : 'tags já associadas'} anteriormente
                      </Typography>
                    </Stack>
                  )}

                  {/* Newly assigned tags from reading */}
                  {assignedEpcs.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Tags lidas (a serem associadas):
                      </Typography>
                      {assignedEpcs.map((epc) => (
                        <Stack key={epc} direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.25, pl: 1 }}>
                          <LocalOfferOutlinedIcon fontSize="small" color="success" />
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {epc}
                          </Typography>
                        </Stack>
                      ))}
                    </Box>
                  )}

                  {assignedEpcs.length === 0 && produto.tagsAssociadas === 0 && (
                    <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                      Nenhuma tag associada ainda.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        {/* ── RFID Reader Panel ─────────────────────────────── */}
        {!finalizado && (
          <RfidReaderPanel
            ref={readerRef}
            host={equipamento.ipConexao}
            port={equipamento.portaConexao}
            showAdvancedSettings={equipamento.exibeConexaoSocket}
            onTagsChange={setTags}
            onReadingChange={(reading) => {
              setIsReading(reading);
              onStateChange?.();
            }}
            renderTagRow={renderTagRow}
            extraActions={extraActions}
            disableDiscard={isSubmitting}
          />
        )}

        {isSubmitting && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
      </Box>
    );
  }
);

export default AssociacaoLeitura;
