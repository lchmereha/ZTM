import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Icons
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
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
import type { LeituraHandler } from './types';

// ── Props ───────────────────────────────────────────────────

interface LeituraBaixaProps {
  movimentacaoId: number;
  host: string;
  port: string;
  showAdvancedSettings?: boolean;
  onComplete?: () => void;
  onSituacaoChange?: (situacao: string) => void;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

const LeituraBaixa = forwardRef<LeituraHandler, LeituraBaixaProps>(
  ({ movimentacaoId, host, port, showAdvancedSettings = false, onComplete, onSituacaoChange, onStateChange }, ref) => {
    const theme = useTheme();
    const { showSnackbar } = useSnackbar();
    const { showDialog, closeDialog } = useDialog();
    const handleError = useErrorHandler();

    const readerRef = useRef<RfidReaderPanelHandle>(null);
    const [tags, setTags] = useState<RfidTagWithCounter[]>([]);
    const [isReading, setIsReading] = useState(false);
    const isReadingRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set of EPCs that were not found in the database
    const [invalidEpcs, setInvalidEpcs] = useState<Set<string>>(new Set());
    // Set of EPCs that exist but are already deactivated (dataBaixa != null)
    const [baixadoEpcs, setBaixadoEpcs] = useState<Set<string>>(new Set());

    const hasErrors = invalidEpcs.size > 0;
    const hasBaixados = baixadoEpcs.size > 0;
    const hasData = tags.length > 0;
    const canFinalize = hasData && !isReading && !hasErrors && !hasBaixados;

    // ── Validation ───────────────────────────────────────────

    const handleValidate = useCallback(async (): Promise<boolean> => {
      // Always read from readerRef to avoid stale closure (tags state may
      // not have flushed yet when called right after stopReading).
      const currentTags = readerRef.current?.tags ?? tags;
      if (currentTags.length === 0) return false;

      try {
        const codigosRfid = currentTags.map((t) => t.tag.codigoRfid);
        const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/leitura/validar`, { codigosRfid });

        const newInvalid = new Set<string>(data.naoEncontrados ?? []);
        const newBaixados = new Set<string>(data.jaBaixados ?? []);

        setInvalidEpcs(newInvalid);
        setBaixadoEpcs(newBaixados);

        if (newInvalid.size > 0 || newBaixados.size > 0) {
          const parts: string[] = [];
          if (newInvalid.size > 0) {
            parts.push(`${newInvalid.size} ${newInvalid.size === 1 ? 'etiqueta não encontrada' : 'etiquetas não encontradas'} no sistema`);
          }
          if (newBaixados.size > 0) {
            parts.push(`${newBaixados.size} ${newBaixados.size === 1 ? 'etiqueta já baixada' : 'etiquetas já baixadas'}`);
          }
          showSnackbar({
            title: 'Problemas encontrados',
            message: `${parts.join(' e ')}. Corrija antes de dar baixa.`,
            severity: 'error'
          });
          return false;
        }

        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    }, [tags, movimentacaoId, showSnackbar, handleError]);

    // ── Baixa ────────────────────────────────────────────────

    const handleBaixa = useCallback(async () => {
      // Validate first — returns false if there are errors
      const isValid = await handleValidate();
      if (!isValid) return;

      const codigosRfid = tags.map((t) => t.tag.codigoRfid);

      showDialog({
        dividers: false,
        title: 'Confirmar Baixa',
        content: `Dar baixa em ${tags.length} ${tags.length === 1 ? 'etiqueta' : 'etiquetas'}? Essa ação irá definir a data de baixa para agora e finalizar a movimentação.`,
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

                if (codigosRfid.length > BATCH_SIZE) {
                  // Batch mode
                  showDialog({
                    title: 'Enviando etiquetas...',
                    content: (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress variant="determinate" value={0} id="batch-progress-bar" />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }} id="batch-progress-text">
                          0 / {codigosRfid.length}
                        </Typography>
                      </Box>
                    ),
                    actions: [],
                    dismissable: false,
                    maxWidth: 'xs'
                  });

                  try {
                    for (let i = 0; i < codigosRfid.length; i += BATCH_SIZE) {
                      const batch = codigosRfid.slice(i, i + BATCH_SIZE);
                      await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/leitura/lotes`, { codigosRfid: batch });
                      const sent = Math.min(i + BATCH_SIZE, codigosRfid.length);
                      const pct = Math.round((sent / codigosRfid.length) * 100);
                      const bar = document
                        .getElementById('batch-progress-bar')
                        ?.querySelector('[role="progressbar"]') as HTMLElement | null;
                      const text = document.getElementById('batch-progress-text');
                      if (bar) bar.style.transform = `translateX(-${100 - pct}%)`;
                      if (text) text.textContent = `${sent} / ${codigosRfid.length}`;
                    }

                    const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/leitura/concluir-lotes`);
                    closeDialog();

                    showSnackbar({
                      title: 'Baixa realizada!',
                      message: `${data.totalBaixa} ${data.totalBaixa === 1 ? 'etiqueta recebeu' : 'etiquetas receberam'} baixa com sucesso.`,
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
                  const { data } = await axios.post(`${movimentacaoEndpoint}/${movimentacaoId}/leitura/baixa`, { codigosRfid });
                  showSnackbar({
                    title: 'Baixa realizada!',
                    message: `${data.totalBaixa} ${data.totalBaixa === 1 ? 'etiqueta recebeu' : 'etiquetas receberam'} baixa com sucesso.`,
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
            Confirmar Baixa
          </Button>
        ],
        dismissable: false,
        maxWidth: 'sm'
      });
    }, [tags, movimentacaoId, handleValidate, showDialog, closeDialog, showSnackbar, handleError, onSituacaoChange, onComplete]);

    // ── Tags change handler ──────────────────────────────────

    const handleTagsChange = useCallback(
      (newTags: RfidTagWithCounter[]) => {
        setTags(newTags);
        // Only clear validation state while actively reading (user is still
        // scanning). When reading has stopped, the validation results must
        // persist — clearing here was causing the "flash then disappear" bug.
        if (isReadingRef.current) {
          if (invalidEpcs.size > 0) setInvalidEpcs(new Set());
          if (baixadoEpcs.size > 0) setBaixadoEpcs(new Set());
        }
      },
      [invalidEpcs.size, baixadoEpcs.size]
    );

    const handleReadingChange = useCallback(
      (reading: boolean) => {
        setIsReading(reading);
        isReadingRef.current = reading;

        // When reading stops, validate automatically.
        if (!reading && readerRef.current && readerRef.current.tags.length > 0) {
          const snapshotTags = [...readerRef.current.tags];
          setTags(snapshotTags);
          setTimeout(() => {
            handleValidate();
          }, 100);
        }
      },
      [handleValidate]
    );

    // ── Sort tags: errors first, then baixados ───────────────

    const sortedTags = [...tags].sort((a, b) => {
      const aInvalid = invalidEpcs.has(a.tag.codigoRfid) ? 0 : 1;
      const bInvalid = invalidEpcs.has(b.tag.codigoRfid) ? 0 : 1;
      if (aInvalid !== bInvalid) return aInvalid - bInvalid;

      const aBaixado = baixadoEpcs.has(a.tag.codigoRfid) ? 0 : 1;
      const bBaixado = baixadoEpcs.has(b.tag.codigoRfid) ? 0 : 1;
      return aBaixado - bBaixado;
    });

    // ── Custom tag row renderer ──────────────────────────────

    const renderTagRow = useCallback(
      (item: RfidTagWithCounter, idx: number) => {
        const isInvalid = invalidEpcs.has(item.tag.codigoRfid);
        const isBaixado = !isInvalid && baixadoEpcs.has(item.tag.codigoRfid);
        const isEvenRow = idx % 2 === 0;

        // Determine colors based on state
        let bgColor: string;
        let textColor: string;
        let hoverBg: string;
        let label: string | undefined;

        if (isInvalid) {
          bgColor = 'md3.errorContainer';
          textColor = 'md3.onErrorContainer';
          hoverBg = 'md3.errorContainer';
          label = 'não encontrada';
        } else if (isBaixado) {
          bgColor = theme.palette.warning.main;
          textColor = theme.palette.warning.contrastText;
          hoverBg = theme.palette.warning.dark;
          label = 'já baixada';
        } else {
          bgColor = isEvenRow ? 'transparent' : theme.palette.action.hover;
          textColor = 'inherit';
          hoverBg = theme.palette.action.selected;
          label = undefined;
        }

        const hasState = isInvalid || isBaixado;

        return (
          <Box
            key={item.tag.codigoRfid}
            sx={{
              display: 'flex',
              px: 1,
              py: 0.5,
              bgcolor: bgColor,
              filter: hasState && isEvenRow ? 'brightness(1.5)' : undefined,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: hoverBg,
                filter: hasState ? (isEvenRow ? 'brightness(1.65)' : 'brightness(1.15)') : undefined
              }
            }}
            onClick={() => navigator.clipboard.writeText(item.tag.codigoRfid)}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontFamily: 'monospace',
                flex: 1,
                color: textColor,
                fontWeight: hasState ? 700 : 400
              }}
            >
              {item.tag.codigoRfid}
              {label && (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: textColor }}>
                  ({label})
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
                color: textColor
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
                color: textColor
              }}
            >
              {item.count}
            </Typography>
          </Box>
        );
      },
      [invalidEpcs, baixadoEpcs, theme]
    );

    // ── Imperative Handle ────────────────────────────────────

    const hasIssues = hasErrors || hasBaixados;

    useImperativeHandle(
      ref,
      () => ({
        handleProcess: canFinalize ? handleBaixa : undefined,
        processLabel: 'Dar Baixa',
        processLabelSubmitting: 'Processando...',
        processTooltip: hasErrors
          ? 'Existem etiquetas não encontradas no sistema'
          : hasBaixados
            ? 'Existem etiquetas que já foram baixadas'
            : isReading
              ? 'Pare a leitura antes de dar baixa'
              : 'Dar baixa nas etiquetas lidas',
        hasData,
        isSubmitting,
        isReading
      }),
      [canFinalize, handleBaixa, hasErrors, hasBaixados, isReading, hasData, isSubmitting]
    );

    // Notify parent of state changes
    const stateKey = `${tags.length}-${isReading}-${isSubmitting}-${invalidEpcs.size}-${baixadoEpcs.size}`;
    const prevStateKey = useRef(stateKey);
    useEffect(() => {
      if (prevStateKey.current !== stateKey) {
        prevStateKey.current = stateKey;
        onStateChange?.();
      }
    }, [stateKey, onStateChange]);

    // ── Extra actions for RfidReaderPanel ─────────────────────

    const extraActions =
      !isReading && tags.length > 0 ? (
        <Tooltip title={hasIssues ? 'Corrija os problemas antes de dar baixa' : 'Dar baixa nas etiquetas lidas'}>
          <span>
            <IconButton
              color="success"
              onClick={handleBaixa}
              disabled={!canFinalize || isSubmitting}
              sx={{ bgcolor: canFinalize ? theme.palette.success.light + '22' : undefined }}
            >
              <CheckCircleOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      ) : undefined;

    return (
      <RfidReaderPanel
        ref={readerRef}
        host={host}
        port={port}
        showAdvancedSettings={showAdvancedSettings}
        onTagsChange={handleTagsChange}
        onReadingChange={handleReadingChange}
        renderTagRow={hasIssues ? renderTagRow : undefined}
        overrideTags={hasIssues ? sortedTags : undefined}
        extraActions={extraActions}
        disableDiscard={isSubmitting}
      />
    );
  }
);

export default LeituraBaixa;
