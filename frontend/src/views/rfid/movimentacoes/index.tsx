import { useCallback, useMemo, useRef, useState } from 'react';

// Icons
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BlockIcon from '@mui/icons-material/Block';
import ClearIcon from '@mui/icons-material/Clear';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FilterListIcon from '@mui/icons-material/FilterList';
import LinkIcon from '@mui/icons-material/Link';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PrintIcon from '@mui/icons-material/Print';
import PublishIcon from '@mui/icons-material/Publish';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import SensorsIcon from '@mui/icons-material/Sensors';

// ── Composite icon: Print + small Replay overlay ────────────

const ReprintIcon = () => (
  <Box sx={{ position: 'relative', display: 'inline-flex', width: 24, height: 24 }}>
    <PrintIcon sx={{ fontSize: 24 }} />
    <Box
      sx={{
        position: 'absolute',
        bottom: -4,
        right: -6,
        backgroundColor: 'var(--palette-background-paper)',
        borderRadius: '50%',
        width: 16,
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ReplayIcon sx={{ fontSize: 14, stroke: 'currentColor', strokeWidth: 2 }} />
    </Box>
  </Box>
);

// MUI
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// Project
import { useContextFilter } from 'hooks/useContextFilter';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableFilterDialog, type DTFilter } from 'ui-component/datatable';
import MovimentacaoFilter, { emptyFilters, type MovimentacaoFilters } from './Filter';
import type { IMovimentacaoForm } from './Form';

// Local — decomposed modules
import { usePermissions } from 'hooks/usePermissions';
import AssociacaoDialog from './associacao/Dialog';
import ConferenciaDialog from './conferencia/Dialog';
import MovimentacaoFormDialog from './FormDialog';
import ImpressaoDialog from './impressao/Dialog';
import LeituraDialog from './leitura/Dialog';
import { useSubDialog } from './shared/useSubDialog';
import TransferenciaDialog from './transferencia/Dialog';
import { useMovimentacaoCrud } from './useMovimentacaoCrud';

// ── Dynamic action labels based on situacao + tipo ──────────

const getDynamicAction = (situacao: string, tipoOpcao?: string): { label: string; icon: React.ReactNode } | null => {
  if (tipoOpcao === 'LEITURA') {
    switch (situacao) {
      case 'CRIADO':
        return { label: 'Leitura', icon: <SensorsIcon /> };
      case 'FINALIZADO':
        return { label: 'Relatório', icon: <AssignmentIcon /> };
      default:
        return null;
    }
  }
  if (tipoOpcao === 'ASSOCIACAO') {
    switch (situacao) {
      case 'CRIADO':
        return { label: 'Importar', icon: <PublishIcon /> };
      case 'IMPORTADO':
        return { label: 'Associar', icon: <LinkIcon /> };
      case 'FINALIZADO':
        return { label: 'Relatório', icon: <AssignmentIcon /> };
      default:
        return null;
    }
  }
  if (tipoOpcao === 'CONFERENCIA') {
    switch (situacao) {
      case 'CRIADO':
        return { label: 'Importar', icon: <PublishIcon /> };
      case 'IMPORTADO':
        return { label: 'Conferir', icon: <FactCheckIcon /> };
      case 'FINALIZADO':
        return { label: 'Relatório', icon: <AssignmentIcon /> };
      default:
        return null;
    }
  }
  switch (situacao) {
    case 'CRIADO':
      return { label: 'Importar', icon: <PublishIcon /> };
    case 'IMPORTADO':
      return { label: 'Processar', icon: <PlayArrowIcon /> };
    case 'PROCESSADO':
      if (tipoOpcao === 'IMPRESSAO') return { label: 'Imprimir', icon: <PrintIcon /> };
      return null;
    case 'FINALIZADO':
      if (tipoOpcao === 'IMPRESSAO') return { label: 'Reimprimir', icon: <ReprintIcon /> };
      if (tipoOpcao === 'TRANSFERENCIA') return { label: 'Relatório', icon: <AssignmentIcon /> };
      return null;
    default:
      return null;
  }
};

// ── Constants ───────────────────────────────────────────────

const SLED_CHECK_TYPES = new Set(['LEITURA', 'ASSOCIACAO', 'CONFERENCIA', 'TRANSFERENCIA']);

// ── Page ────────────────────────────────────────────────────

const MovimentacaoPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('MOV_RFID');

  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const handleError = useErrorHandler();

  // ── DataTable ref (owned here, passed to hook) ───────────
  const contextFilter = useContextFilter('filial');
  const tableRef = useRef<{ reload: () => void }>(null);
  const reloadTable = useCallback(() => tableRef.current?.reload(), []);

  const {
    handleFetchData,
    columns,
    formDialogOpen,
    setFormDialogOpen,
    selectedItem,
    selectedItemMeta,
    tiposMovimentacao,
    handleOpenAdd,
    handleOpenEdit,
    handleCancel,
    saveMovimentacao,
    validationSchema,
    currentInitialValues,
    equipamentos
  } = useMovimentacaoCrud(reloadTable);

  // ── Sub-dialogs ──────────────────────────────────────────
  const impressao = useSubDialog(reloadTable);
  const leitura = useSubDialog(reloadTable);
  const associacao = useSubDialog(reloadTable);
  const conferencia = useSubDialog(reloadTable);
  const transferencia = useSubDialog(reloadTable);

  // ── Busca global ─────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  // ── Filtros avançados ────────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState<MovimentacaoFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.idTipoMovimentacao.length > 0) count++;
    if (appliedFilters.situacao.length > 0) count++;
    if (appliedFilters.descricao.trim()) count++;
    return count;
  }, [appliedFilters]);

  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    if (appliedFilters.idTipoMovimentacao.length > 0) {
      result.push({ field: 'idTipoMovimentacao', type: 'in', value: appliedFilters.idTipoMovimentacao });
    }
    if (appliedFilters.situacao.length > 0) {
      result.push({ field: 'situacao', type: 'in', value: appliedFilters.situacao });
    }
    if (appliedFilters.descricao.trim()) {
      result.push({ field: 'descricao', type: 'contains', value: appliedFilters.descricao.trim() });
    }
    return result;
  }, [appliedFilters]);

  // ── Form submit with post-create orchestration ───────────

  const handleSubmit = useCallback(
    async (values: IMovimentacaoForm, action: 'save' | 'import' | 'leitura' | 'associacao' | 'conferencia' | 'transferencia') => {
      try {
        const created = await saveMovimentacao(values);

        if (created && action !== 'save') {
          const openMap: Record<string, (movId: number, sit?: string) => void> = {
            import: impressao.openDialog,
            leitura: leitura.openDialog,
            associacao: associacao.openDialog,
            conferencia: conferencia.openDialog,
            transferencia: transferencia.openDialog
          };
          const open = openMap[action];
          if (open) {
            setFormDialogOpen(false);
            reloadTable();
            open(created.id, 'CRIADO');
            return;
          }
        }

        setFormDialogOpen(false);
        reloadTable();
      } catch (err) {
        handleError(err);
      }
    },
    [
      saveMovimentacao,
      setFormDialogOpen,
      reloadTable,
      impressao.openDialog,
      leitura.openDialog,
      associacao.openDialog,
      conferencia.openDialog,
      transferencia.openDialog,
      handleError
    ]
  );

  // ── Dynamic action (opens sub-dialogs) ───────────────────

  const handleDynamicAction = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTable row type is generic
    (item: Record<string, any>) => {
      const tipoOpcao = item.tipo?.tipo;
      const { situacao } = item;

      // SLED check for antenna-only movement types (only block processing steps, allow import/reports)
      if (SLED_CHECK_TYPES.has(tipoOpcao) && item.equipamento?.tipo === 'SLED') {
        const isReadingAction = (tipoOpcao === 'LEITURA' && situacao === 'CRIADO') || (tipoOpcao !== 'LEITURA' && situacao === 'IMPORTADO');

        if (isReadingAction) {
          showSnackbar({
            title: 'Equipamento não suportado',
            message: `Ações de ${tipoOpcao.toLowerCase()} via web só estão disponíveis para equipamentos do tipo Antena. Utilize o aplicativo móvel para equipamentos SLED.`,
            severity: 'warning'
          });
          return;
        }
      }

      const openMap: Record<string, (movId: number, sit?: string) => void> = {
        IMPRESSAO: impressao.openDialog,
        LEITURA: leitura.openDialog,
        ASSOCIACAO: associacao.openDialog,
        CONFERENCIA: conferencia.openDialog,
        TRANSFERENCIA: transferencia.openDialog
      };
      const open = openMap[tipoOpcao];
      if (open) {
        open(item.id, situacao);
        return;
      }

      // Fallback for unimplemented types
      switch (situacao) {
        case 'CRIADO':
          showSnackbar({ message: `Importação para tipo "${tipoOpcao}" ainda não implementada.`, severity: 'info' });
          break;
        default:
          showSnackbar({ message: `Ação para "${situacao}" ainda não implementada.`, severity: 'info' });
          break;
      }
    },
    [showSnackbar, impressao, leitura, associacao, conferencia, transferencia]
  );

  // ── Render ───────────────────────────────────────────────

  return (
    <MainCard
      title="Movimentações"
      secondary={
        <Grid container size="grow" spacing={1} sx={{ alignItems: 'center' }}>
          {/* Busca global */}
          <Grid size="grow">
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              slotProps={{
                input: {
                  sx: { input: { color: theme.vars?.palette.text.primary } },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: theme.vars?.palette.text.primary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ visibility: searchTerm ? 'visible' : 'hidden' }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchTerm('');
                          setDebouncedSearch('');
                        }}
                        sx={{ color: theme.vars?.palette.text.primary }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>

          {/* Botão Filtros */}
          <Grid size="auto">
            <Tooltip title="Filtros avançados">
              <IconButton
                onClick={() => setFilterDialogOpen(true)}
                size="small"
                sx={{
                  background: theme.vars?.palette.md3.secondaryContainer,
                  color: theme.vars?.palette.md3.onSecondaryContainer,
                  borderRadius: 2
                }}
              >
                <Badge badgeContent={activeFilterCount} color="primary">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Grid>

          {/* Adicionar */}
          {podeIncluir && (
            <Grid size="auto">
              <Tooltip title="Nova Movimentação">
                <IconButton
                  size="small"
                  onClick={handleOpenAdd}
                  sx={{
                    background: theme.vars?.palette.md3.primaryContainer,
                    color: theme.vars?.palette.md3.onPrimaryContainer,
                    borderRadius: 2
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      }
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTable row type is generic */}
      <DataTable<any>
        ref={tableRef}
        columns={columns}
        search={debouncedSearch}
        filters={filters}
        contextFilter={contextFilter}
        onFetchData={handleFetchData}
        onError={handleError}
        rowActions={(item) => {
          const dynamicAction = getDynamicAction(item.situacao, item.tipo?.tipo);

          if (!podeAlterar && !podeExcluir && !dynamicAction) return undefined;

          return (
            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
              {dynamicAction ? (
                <Tooltip title={dynamicAction.label}>
                  <IconButton color="inherit" onClick={() => handleDynamicAction(item)} size="small">
                    {dynamicAction.icon}
                  </IconButton>
                </Tooltip>
              ) : (
                <IconButton size="small" sx={{ visibility: 'hidden' }}>
                  <PlayArrowIcon />
                </IconButton>
              )}

              {podeAlterar && (
                <Tooltip title="Editar">
                  <IconButton color="inherit" onClick={() => handleOpenEdit(item)} size="small">
                    <EditTwoToneIcon />
                  </IconButton>
                </Tooltip>
              )}

              {podeExcluir &&
                (item.situacao !== 'FINALIZADO' && item.situacao !== 'CANCELADO' ? (
                  <Tooltip title="Cancelar">
                    <IconButton sx={{ color: theme.vars?.palette.md3.error }} onClick={() => handleCancel(item)} size="small">
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <IconButton size="small" sx={{ visibility: 'hidden' }}>
                    <BlockIcon />
                  </IconButton>
                ))}
            </Stack>
          );
        }}
      />

      {/* ── Form Dialog ─────────────────────────────────────── */}
      {formDialogOpen && (
        <MovimentacaoFormDialog
          open={formDialogOpen}
          onClose={() => setFormDialogOpen(false)}
          selectedItem={selectedItem}
          selectedItemMeta={selectedItemMeta}
          tiposMovimentacao={tiposMovimentacao}
          equipamentos={equipamentos}
          currentInitialValues={currentInitialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        />
      )}

      {/* ── Filtros Avançados ────────────────────────────────── */}
      <DataTableFilterDialog<MovimentacaoFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setFilterDialogOpen(false);
        }}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <MovimentacaoFilter draft={draft} setDraft={setDraft} />}
      />

      {/* ── Impressão Dialog ─────────────────────────────────── */}
      <ImpressaoDialog
        open={impressao.open}
        onClose={impressao.closeDialog}
        movimentacaoId={impressao.movimentacaoId}
        situacao={impressao.situacao}
      />

      {/* ── Leitura Dialog ─────────────────────────────────── */}
      <LeituraDialog
        open={leitura.open}
        onClose={leitura.closeDialog}
        movimentacaoId={leitura.movimentacaoId}
        situacao={leitura.situacao}
      />

      {/* ── Associação Dialog ───────────────────────────────── */}
      <AssociacaoDialog
        open={associacao.open}
        onClose={associacao.closeDialog}
        movimentacaoId={associacao.movimentacaoId}
        situacao={associacao.situacao}
      />

      {/* ── Conferência Dialog ──────────────────────────────── */}
      <ConferenciaDialog
        open={conferencia.open}
        onClose={conferencia.closeDialog}
        movimentacaoId={conferencia.movimentacaoId}
        situacao={conferencia.situacao}
      />

      {/* ── Transferência Dialog ────────────────────────────── */}
      <TransferenciaDialog
        open={transferencia.open}
        onClose={transferencia.closeDialog}
        movimentacaoId={transferencia.movimentacaoId}
        situacao={transferencia.situacao}
      />
    </MainCard>
  );
};

export default MovimentacaoPage;
