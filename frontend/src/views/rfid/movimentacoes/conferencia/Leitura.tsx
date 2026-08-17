import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// MUI
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// Project
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import { type RfidTagWithCounter } from 'services/rfid/types';
import { movimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';
import RfidReaderPanel, { type RfidReaderPanelHandle } from '../shared/RfidReaderPanel';
import type { MovimentacaoStepHandler } from '../shared/types';

// ── Types ───────────────────────────────────────────────────

interface TagAtiva {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
}

interface ProdutoConferencia {
  importacaoItemId: number;
  idProduto: number | null;
  codigo: string;
  nome: string;
  unidadeMedida: string;
  categoria: string;
  quantidadeConferencia: number;
  codigoUnico: string | null;
  codigoRfidEsperado: string | null;
  tagsAtivas: TagAtiva[];
  totalTagsAtivas: number;
}

interface EquipamentoInfo {
  ipConexao: string;
  portaConexao: string;
  exibeConexaoSocket: boolean;
}

// ── Props ───────────────────────────────────────────────────

interface ConferenciaLeituraProps {
  movimentacaoId: number;
  onComplete?: () => void;
  onStateChange?: () => void;
  onSituacaoChange?: (situacao: string) => void;
  finalizado?: boolean;
}

// ── Component ───────────────────────────────────────────────

const ConferenciaLeitura = forwardRef<MovimentacaoStepHandler, ConferenciaLeituraProps>(
  ({ movimentacaoId, onComplete, onStateChange, onSituacaoChange, finalizado = false }, ref) => {
    const theme = useTheme();
    const { showSnackbar } = useSnackbar();
    const { showDialog, closeDialog } = useDialog();
    const handleError = useErrorHandler();

    // ── State ─────────────────────────────────────────────────
    const readerRef = useRef<RfidReaderPanelHandle>(null);
    const [produtos, setProdutos] = useState<ProdutoConferencia[]>([]);
    const [equipamento, setEquipamento] = useState<EquipamentoInfo | null>(null);
    const [tags, setTags] = useState<RfidTagWithCounter[]>([]);
    const [isReading, setIsReading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Map: tagRfidId → readEPC (which EPC was read for that active tag)
    const [vinculacoes, setVinculacoes] = useState<Map<number, string>>(new Map());

    // ── Derived ───────────────────────────────────────────────

    // Build lookup: codigoRfid → tagAtiva info (ALL active tags across all products)
    const activeTagMap = useMemo(() => {
      const map = new Map<string, { tagAtiva: TagAtiva; produto: ProdutoConferencia }>();
      for (const produto of produtos) {
        for (const tag of produto.tagsAtivas) {
          map.set(tag.codigoRfid, { tagAtiva: tag, produto });
        }
      }
      return map;
    }, [produtos]);

    // Total tags needed = sum of quantidadeConferencia across all products
    const totalNeeded = useMemo(() => produtos.reduce((acc, p) => acc + p.quantidadeConferencia, 0), [produtos]);

    // Count vinculações (auto-matched tags) — these are the conferidas
    const totalConferidas = vinculacoes.size;

    const isComplete = totalConferidas === totalNeeded && totalNeeded > 0;

    // Track unknown EPCs (read but not matching ANY active tag)
    const unknownEpcs = useMemo(() => {
      return tags.filter((t) => !activeTagMap.has(t.tag.codigoRfid)).map((t) => t.tag.codigoRfid);
    }, [tags, activeTagMap]);

    // Track excess EPCs: known tags that were NOT vinculada because the product
    // already has enough matches (read more tags than quantidadeConferencia)
    const excessEpcSet = useMemo(() => {
      const vinculatedEpcs = new Set(vinculacoes.values());
      const set = new Set<string>();

      for (const readTag of tags) {
        const epc = readTag.tag.codigoRfid;
        const match = activeTagMap.get(epc);
        // Known tag, but not auto-matched → product already has enough = excess
        if (match && !vinculatedEpcs.has(epc)) {
          set.add(epc);
        }
      }

      return set;
    }, [tags, activeTagMap, vinculacoes]);

    const hasUnknown = unknownEpcs.length > 0;
    const hasExcess = excessEpcSet.size > 0;
    const hasDivergence = totalConferidas < totalNeeded && totalConferidas > 0;

    // Can finalize: tags read, no unknowns, no excess, not reading, not finalized
    const canFinalize = tags.length > 0 && !hasUnknown && !hasExcess && !isReading && !finalizado;

    // ── Auto-match tags as they are read ──────────────────────

    useEffect(() => {
      if (tags.length === 0 || produtos.length === 0) return;

      setVinculacoes((prev) => {
        const next = new Map(prev);
        let changed = false;

        // Count current vinculações per product to enforce limits
        const countPerProduct = new Map<number, number>();
        for (const [tagId] of next) {
          for (const produto of produtos) {
            if (produto.idProduto && produto.tagsAtivas.some((t) => t.id === tagId)) {
              countPerProduct.set(produto.idProduto, (countPerProduct.get(produto.idProduto) ?? 0) + 1);
              break;
            }
          }
        }

        for (const readTag of tags) {
          const epc = readTag.tag.codigoRfid;
          const match = activeTagMap.get(epc);
          if (!match) continue; // Unknown tag — skip

          const { tagAtiva, produto } = match;
          if (!produto.idProduto) continue;

          // Don't overwrite existing vinculação
          if (next.has(tagAtiva.id)) continue;

          // Only match if product still has room (count < quantidadeConferencia)
          const currentCount = countPerProduct.get(produto.idProduto) ?? 0;
          if (currentCount >= produto.quantidadeConferencia) continue;

          next.set(tagAtiva.id, epc);
          countPerProduct.set(produto.idProduto, currentCount + 1);
          changed = true;
        }

        return changed ? next : prev;
      });
    }, [tags, produtos, activeTagMap]);

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

          // Fetch products for conferencia
          const { data: prodData } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/conferencia/produtos`);
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

      // Build payload from vinculações
      const vinculacoesList: { idProduto: number; idTagRfid: number; codigoRfidLido: string }[] = [];
      for (const [tagId, epc] of vinculacoes) {
        const match = activeTagMap.get(epc);
        if (match?.produto.idProduto) {
          vinculacoesList.push({
            idProduto: match.produto.idProduto,
            idTagRfid: tagId,
            codigoRfidLido: epc
          });
        }
      }

      showDialog({
        dividers: false,
        title: 'Confirmar Conferência',
        content: (
          <Stack spacing={1.5}>
            <Typography>
              Conferir {vinculacoesList.length} {vinculacoesList.length === 1 ? 'tag' : 'tags'} em{' '}
              {produtos.filter((p) => p.idProduto).length} {produtos.length === 1 ? 'produto' : 'produtos'}?
            </Typography>
            {hasDivergence && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <WarningAmberIcon color="warning" fontSize="small" />
                <Typography variant="body2" color="warning.main">
                  Divergência de quantidade: {totalConferidas} de {totalNeeded} tags esperadas foram lidas.
                </Typography>
              </Stack>
            )}
          </Stack>
        ),
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
                const BATCH_SIZE = 100;

                if (vinculacoesList.length > BATCH_SIZE) {
                  // Batch mode
                  showDialog({
                    title: 'Enviando vinculações...',
                    content: (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress variant="determinate" value={0} id="batch-progress-bar" />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }} id="batch-progress-text">
                          0 / {vinculacoesList.length}
                        </Typography>
                      </Box>
                    ),
                    actions: [],
                    dismissable: false,
                    maxWidth: 'xs'
                  });

                  try {
                    for (let i = 0; i < vinculacoesList.length; i += BATCH_SIZE) {
                      const batch = vinculacoesList.slice(i, i + BATCH_SIZE);
                      await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/conferencia/lotes`, { vinculacoes: batch });
                      const sent = Math.min(i + BATCH_SIZE, vinculacoesList.length);
                      const pct = Math.round((sent / vinculacoesList.length) * 100);
                      const bar = document
                        .getElementById('batch-progress-bar')
                        ?.querySelector('[role="progressbar"]') as HTMLElement | null;
                      const text = document.getElementById('batch-progress-text');
                      if (bar) bar.style.transform = `translateX(-${100 - pct}%)`;
                      if (text) text.textContent = `${sent} / ${vinculacoesList.length}`;
                    }

                    const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/conferencia/concluir-lotes`);
                    closeDialog();

                    showSnackbar({
                      title: 'Conferência concluída!',
                      message: `${data.totalConferidas ?? vinculacoesList.length} ${(data.totalConferidas ?? vinculacoesList.length) === 1 ? 'tag foi conferida' : 'tags foram conferidas'} com sucesso.`,
                      severity: 'success'
                    });
                  } catch (batchErr) {
                    try {
                      await axios.delete(`${movimentacaoEndpoint}/${movimentacaoId}/lotes`);
                    } catch {
                      /* ignore */
                    }
                    closeDialog();
                    throw batchErr;
                  }
                } else {
                  // Small payload: direct
                  const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/conferencia/concluir`, {
                    vinculacoes: vinculacoesList
                  });

                  showSnackbar({
                    title: 'Conferência concluída!',
                    message: `${data.totalConferidas ?? vinculacoesList.length} ${(data.totalConferidas ?? vinculacoesList.length) === 1 ? 'tag foi conferida' : 'tags foram conferidas'} com sucesso.`,
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
            Confirmar Conferência
          </Button>
        ],
        dismissable: false,
        maxWidth: 'sm'
      });
    }, [
      canFinalize,
      hasDivergence,
      totalConferidas,
      totalNeeded,
      produtos,
      vinculacoes,
      activeTagMap,
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
        processLabel: 'Concluir Conferência',
        processLabelSubmitting: 'Processando...',
        processTooltip: hasUnknown
          ? `${unknownEpcs.length} tag(s) desconhecida(s). Remova-as para prosseguir.`
          : hasExcess
            ? `${excessEpcSet.size} tag(s) excedente(s). Foram lidas mais tags do que o solicitado para um produto.`
            : !isComplete && totalConferidas > 0
              ? `Divergência: ${totalConferidas}/${totalNeeded} conferidas. Clique para concluir mesmo assim.`
              : totalConferidas === 0
                ? 'Leia tags RFID para iniciar a conferência.'
                : 'Concluir a conferência de tags',
        hasData,
        isSubmitting,
        isReading
      }),
      [
        canFinalize,
        handleConcluir,
        hasUnknown,
        unknownEpcs.length,
        hasExcess,
        excessEpcSet.size,
        isComplete,
        totalConferidas,
        totalNeeded,
        hasData,
        isSubmitting,
        isReading
      ]
    );

    // Notify parent of state changes
    const stateKey = `${tags.length}-${isReading}-${isSubmitting}-${isLoading}-${vinculacoes.size}-${unknownEpcs.length}-${excessEpcSet.size}`;
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
        const isUnknown = !activeTagMap.has(epc);
        const isExcess = excessEpcSet.has(epc);
        const isError = isUnknown || isExcess;
        const isEvenRow = idx % 2 === 0;

        const errorLabel = isUnknown ? '(desconhecida)' : '(excedente)';

        return (
          <Box
            key={epc}
            sx={{
              display: 'flex',
              px: 1,
              py: 0.5,
              bgcolor: isError ? 'md3.errorContainer' : isEvenRow ? 'transparent' : theme.palette.action.hover,
              filter: isError && isEvenRow ? 'brightness(1.5)' : undefined,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: isError ? 'md3.errorContainer' : theme.palette.action.selected,
                filter: isError ? (isEvenRow ? 'brightness(1.65)' : 'brightness(1.15)') : undefined
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
                color: isError ? 'md3.onErrorContainer' : 'inherit',
                fontWeight: isError ? 700 : 400
              }}
            >
              {epc}
              {isError && (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'md3.onErrorContainer' }}>
                  {errorLabel}
                </Typography>
              )}
              {!isError && (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: theme.palette.success.main }}>
                  ✓
                </Typography>
              )}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                width: 70,
                textAlign: 'right',
                fontSize: 12,
                color: isError ? 'md3.onErrorContainer' : 'inherit'
              }}
            >
              {item.tag.rssi}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                width: 50,
                textAlign: 'right',
                color: isError ? 'md3.onErrorContainer' : 'inherit'
              }}
            >
              {item.count}
            </Typography>
          </Box>
        );
      },
      [activeTagMap, excessEpcSet, theme]
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
        <Tooltip title="Concluir conferência">
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
            bgcolor: isComplete ? 'md3.primaryContainer' : hasUnknown || hasExcess ? 'md3.errorContainer' : 'md3.surfaceContainerHigh'
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Progresso da Conferência
            </Typography>
            <Chip
              label={`${totalConferidas} / ${totalNeeded} conferidas`}
              color={isComplete ? 'success' : 'default'}
              size="small"
              variant="filled"
            />
            {hasUnknown && <Chip label={`${unknownEpcs.length} desconhecida(s)`} color="error" size="small" variant="outlined" />}
            {hasExcess && <Chip label={`${excessEpcSet.size} excedente(s)`} color="error" size="small" variant="outlined" />}
            {hasDivergence && !hasUnknown && !hasExcess && (
              <Chip label="Divergência de quantidade" color="warning" size="small" variant="outlined" />
            )}
            {finalizado && <Chip label="Finalizado" color="success" size="small" variant="filled" />}
          </Stack>
          {!finalizado && (
            <LinearProgress
              variant="determinate"
              value={totalNeeded > 0 ? Math.min(100, (totalConferidas / totalNeeded) * 100) : 0}
              sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
              color={isComplete ? 'success' : hasUnknown || hasExcess ? 'error' : 'primary'}
            />
          )}
          {/* Blocking banners */}
          {(hasUnknown || hasExcess) && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                {hasUnknown && hasExcess
                  ? `${unknownEpcs.length} tag(s) desconhecida(s) e ${excessEpcSet.size} excedente(s) detectadas`
                  : hasUnknown
                    ? `${unknownEpcs.length} ${unknownEpcs.length === 1 ? 'tag desconhecida detectada' : 'tags desconhecidas detectadas'}`
                    : `${excessEpcSet.size} ${excessEpcSet.size === 1 ? 'tag excedente detectada' : 'tags excedentes detectadas'} — foram lidas mais tags do que o solicitado para um produto`}
                {' — o processamento está bloqueado.'}
              </Typography>
            </Stack>
          )}
        </Paper>

        {/* ── Product Cards ─────────────────────────────────── */}
        <Box>
          {produtos.map((produto) => {
            const confirmedCount = produto.tagsAtivas.filter((t) => vinculacoes.has(t.id)).length;
            const isFull = confirmedCount >= produto.quantidadeConferencia;

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
                      label={`${confirmedCount} / ${produto.quantidadeConferencia}`}
                      size="small"
                      color={isFull ? 'success' : 'default'}
                      variant={isFull ? 'filled' : 'outlined'}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pl: 2, pr: 2, pb: 1 }}>
                  {/* All active tags — status updates as they are read */}
                  {produto.tagsAtivas.map((tag) => {
                    const isConferida = vinculacoes.has(tag.id);

                    return (
                      <Stack
                        key={tag.id}
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'center',
                          py: 0.5,
                          pl: 1,
                          borderRadius: 1
                        }}
                      >
                        <LocalOfferOutlinedIcon fontSize="small" color={isConferida ? 'success' : 'disabled'} />
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            flex: 1,
                            color: isConferida ? theme.palette.success.main : 'text.primary'
                          }}
                        >
                          {tag.codigoRfid}
                          {tag.codigoUnico && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                              ({tag.codigoUnico})
                            </Typography>
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isConferida ? theme.palette.success.main : 'text.disabled',
                            fontWeight: isConferida ? 600 : 400,
                            minWidth: 80,
                            textAlign: 'right'
                          }}
                        >
                          {isConferida ? '✓ lida' : 'aguardando'}
                        </Typography>
                      </Stack>
                    );
                  })}

                  {produto.tagsAtivas.length === 0 && (
                    <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                      Nenhuma tag ativa encontrada para este produto.
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

export default ConferenciaLeitura;
