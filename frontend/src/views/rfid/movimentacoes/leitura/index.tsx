import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';

// MUI
import InventoryIcon from '@mui/icons-material/Inventory';
import SensorsIcon from '@mui/icons-material/Sensors';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Project
import { useErrorHandler } from 'hooks/useErrorHandler';
import { movimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// Local
import LeituraBaixa from './LeituraBaixa';
import LeituraRelatorio from './LeituraRelatorio';
import LeituraSimples from './LeituraSimples';
import type { LeituraHandler } from './types';

// ── Re-exports ──────────────────────────────────────────────

export type { LeituraHandler } from './types';

// ── Types ───────────────────────────────────────────────────

type LeituraMode = 'escolha' | 'simples' | 'baixa' | 'relatorio';

interface EquipamentoInfo {
  ipConexao: string;
  portaConexao: string;
  exibeConexaoSocket: boolean;
}

// ── Props ───────────────────────────────────────────────────

interface LeituraProps {
  movimentacaoId: number;
  situacao: string;
  onComplete?: () => void;
  onModeChange?: (mode: string) => void;
  onStateChange?: () => void;
}

// ── Component ───────────────────────────────────────────────

/**
 * Orchestrator for Leitura movimentação type.
 *
 * CRIADO     → choice dialog (simples or baixa)
 * FINALIZADO → show report of baixa'd tags (read-only)
 */
const Leitura = forwardRef<LeituraHandler, LeituraProps>(
  ({ movimentacaoId, situacao: initialSituacao, onComplete, onModeChange, onStateChange }, ref) => {
    const handleError = useErrorHandler();
    const [, setSituacao] = useState(initialSituacao);
    const [mode, setMode] = useState<LeituraMode>(initialSituacao === 'FINALIZADO' ? 'relatorio' : 'escolha');
    const [equipamento, setEquipamento] = useState<EquipamentoInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch equipment info
    useEffect(() => {
      const fetchEquipamento = async () => {
        try {
          const { data } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}`);
          const record = Array.isArray(data) ? data[0] : data;
          if (record.equipamento) {
            setEquipamento({
              ipConexao: record.equipamento.ipConexao || '',
              portaConexao: String(record.equipamento.portaConexao || '8080'),
              exibeConexaoSocket: record.equipamento.exibeConexaoSocket ?? false
            });
          }
        } catch (err) {
          handleError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchEquipamento();
    }, [movimentacaoId, handleError]);

    const handleSituacaoChange = useCallback(
      (newSituacao: string) => {
        setSituacao(newSituacao);
        onStateChange?.();
      },
      [onStateChange]
    );

    // Default imperative handle (for choice screen)
    useImperativeHandle(
      ref,
      () => ({
        hasData: false,
        isSubmitting: false,
        isChoiceScreen: mode === 'escolha'
      }),
      [mode]
    );

    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography color="text.secondary">Carregando...</Typography>
        </Box>
      );
    }

    // ── Relatório (FINALIZADO) ────────────────────────────────
    // Report mode doesn't need equipment info — render before the check.

    if (mode === 'relatorio') {
      return <LeituraRelatorio ref={ref} movimentacaoId={movimentacaoId} onStateChange={onStateChange} />;
    }

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

    // ── Choice Screen ────────────────────────────────────────

    if (mode === 'escolha') {
      return (
        <Grid container size="grow" spacing={2}>
          <Grid size={12}>
            <Typography variant="h5" color="text.secondary" sx={{ textAlign: 'center' }}>
              Selecione o modo de leitura
            </Typography>
          </Grid>

          <Grid size={6}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<SensorsIcon />}
              onClick={() => {
                setMode('simples');
                onModeChange?.('simples');
                onStateChange?.();
              }}
              sx={{ px: 4, py: 2 }}
            >
              Leitura Simples
            </Button>
          </Grid>

          <Grid size={6}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<InventoryIcon />}
              onClick={() => {
                setMode('baixa');
                onModeChange?.('baixa');
                onStateChange?.();
              }}
              sx={{ px: 4, py: 2 }}
            >
              Baixa nas Etiquetas
            </Button>
          </Grid>

          <Grid size={12}>
            <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 400, textAlign: 'center', mx: 'auto' }}>
              A leitura simples apenas exibe as etiquetas lidas. A baixa irá registrar a data de saída para as etiquetas encontradas.
            </Typography>
          </Grid>
        </Grid>
      );
    }

    // ── Simples ──────────────────────────────────────────────

    if (mode === 'simples') {
      return (
        <LeituraSimples
          ref={ref}
          host={equipamento.ipConexao}
          port={equipamento.portaConexao}
          showAdvancedSettings={equipamento.exibeConexaoSocket}
          onStateChange={onStateChange}
        />
      );
    }

    // ── Baixa ────────────────────────────────────────────────

    return (
      <LeituraBaixa
        ref={ref}
        movimentacaoId={movimentacaoId}
        host={equipamento.ipConexao}
        port={equipamento.portaConexao}
        showAdvancedSettings={equipamento.exibeConexaoSocket}
        onComplete={onComplete}
        onSituacaoChange={handleSituacaoChange}
        onStateChange={onStateChange}
      />
    );
  }
);

export default Leitura;
