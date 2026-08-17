// packages
import { useCallback, useMemo, useRef, useState } from 'react';
import * as yup from 'yup';

// icons
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

// material-ui
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

// project imports
import { useContextFilter } from 'hooks/useContextFilter';
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { usePermissions } from 'hooks/usePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { dataTablesParam, equipamentoEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, DataTableFilterDialog, dtColumnAtivo, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import EquipamentoFilter, { emptyFilters, type EquipamentoFilters } from './Filter';
import EquipamentoForm, { type IEquipamentoForm } from './Form';

// ==============================|| PAGE - EQUIPAMENTOS ||============================== //

const EquipamentoPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_EQUIPAMENTO');

  const theme = useTheme();
  const contextFilter = useContextFilter('filial');
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IEquipamentoForm | null>(null);

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  // Filtros avançados
  const [appliedFilters, setAppliedFilters] = useState<EquipamentoFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Contagem de filtros aplicados
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.nome.trim()) count++;
    if (appliedFilters.tipo.length > 0) count++;
    if (appliedFilters.idFilial.length > 0) count++;
    if (appliedFilters.ipConexao.trim()) count++;
    if (appliedFilters.portaConexao.trim()) count++;
    if (appliedFilters.ativo) count++;
    if (appliedFilters.exibeConexaoSocket) count++;
    return count;
  }, [appliedFilters]);

  // Converter estado da busca -> DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    if (appliedFilters.nome.trim()) {
      result.push({ field: 'nome', type: 'contains', value: appliedFilters.nome.trim() });
    }
    if (appliedFilters.tipo.length > 0) {
      result.push({ field: 'tipo', type: 'in', value: appliedFilters.tipo });
    }
    if (appliedFilters.idFilial.length > 0) {
      result.push({ field: 'idFilial', type: 'in', value: appliedFilters.idFilial });
    }
    if (appliedFilters.ipConexao.trim()) {
      result.push({ field: 'ipConexao', type: 'contains', value: appliedFilters.ipConexao.trim() });
    }
    if (appliedFilters.portaConexao.trim()) {
      result.push({ field: 'portaConexao', type: 'equals', value: parseInt(appliedFilters.portaConexao, 10) });
    }
    if (appliedFilters.ativo) {
      result.push({ field: 'ativo', type: 'equals', value: appliedFilters.ativo === 'true' });
    }
    if (appliedFilters.exibeConexaoSocket) {
      result.push({ field: 'exibeConexaoSocket', type: 'equals', value: appliedFilters.exibeConexaoSocket === 'true' });
    }
    return result;
  }, [appliedFilters]);

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${equipamentoEndpoint}${dataTablesParam}`, payload);
    return response.data;
  }, []);

  // Debounce da busca global
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  // Diálogo de filtros
  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = useCallback(
    async (item: IEquipamentoForm) => {
      try {
        const { data } = await axios.get(`${equipamentoEndpoint}/${item.id}`);
        setSelectedItem(Array.isArray(data) ? data[0] : data);
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: IEquipamentoForm) => {
      try {
        const payload: Record<string, unknown> = {
          nome: values.nome,
          tipo: values.tipo,
          ipConexao: values.ipConexao,
          portaConexao: values.portaConexao,
          ativo: values.ativo,
          exibeConexaoSocket: values.exibeConexaoSocket
        };

        if (!selectedItem) {
          payload.idFilial = values.idFilial;
        }

        if (selectedItem) {
          await axios.patch(`${equipamentoEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(equipamentoEndpoint, payload);
        }
        setDialogOpen(false);
        showSnackbar({ message: 'Salvo com sucesso!', severity: 'success' });
        tableRef.current?.reload();
      } catch (err) {
        handleError(err);
      }
    },
    [selectedItem, showSnackbar, handleError]
  );

  const handleDelete = useCallback(
    (item: IEquipamentoForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Tem certeza que deseja apagar os registros do hardware "${item.nome}"?`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${equipamentoEndpoint}/${item.id}`);
                tableRef.current?.reload();
                showSnackbar({ message: 'Excluído com sucesso!', severity: 'success' });
                closeDialog();
              } catch (err) {
                handleError(err);
              }
            }}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        ]
      });
    },
    [showDialog, closeDialog, showSnackbar, handleError]
  );

  const columns = useMemo(
    () => [
      { title: 'ID', data: 'id', width: '1px' },
      { title: 'Denominação', data: 'nome' },
      { title: 'Tipo', data: 'tipo' },
      { title: 'Filial', data: 'filial.nome' },
      dtColumnAtivo()
    ],
    []
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        idFilial: yup.number().min(1, 'Selecione uma filial').required('Selecione uma filial'),
        nome: yup.string().required('Informe o nome do equipamento'),
        tipo: yup.string().required('Informe o tipo do equipamento')
      }),
    []
  );

  const initialValues: IEquipamentoForm = useMemo(
    () => ({
      id: 0,
      idFilial: 0,
      nome: '',
      tipo: 'ANTENA',
      ipConexao: '',
      portaConexao: undefined,
      ativo: true,
      exibeConexaoSocket: false
    }),
    []
  );

  return (
    <MainCard
      title="Equipamentos"
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
                onClick={handleOpenFilterDialog}
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
              <Tooltip title="Vincular Novo Equipamento">
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
      <DataTable<IEquipamentoForm>
        ref={tableRef}
        columns={columns}
        search={debouncedSearch}
        filters={filters}
        contextFilter={contextFilter}
        onFetchData={handleFetchData}
        onError={handleError}
        rowActions={
          podeAlterar || podeExcluir
            ? (item) => (
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  {podeAlterar && (
                    <Tooltip title="Editar">
                      <IconButton color="inherit" onClick={() => handleOpenEdit(item)} size="small">
                        <EditTwoToneIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {podeExcluir && (
                    <Tooltip title="Excluir">
                      <IconButton sx={{ color: theme.vars?.palette.md3.error }} onClick={() => handleDelete(item)} size="small">
                        <DeleteTwoToneIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )
            : undefined
        }
      />

      {dialogOpen && (
        <DataTableDialog<IEquipamentoForm>
          open={dialogOpen}
          maxWidth="sm"
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          item={selectedItem}
          validationSchema={validationSchema}
          initialValues={initialValues}
          renderForm={() => <EquipamentoForm />}
          title={selectedItem ? 'Configurar Equipamento' : 'Posicionar Equipamento'}
        />
      )}

      {/* Diálogo de Filtros Avançados */}
      <DataTableFilterDialog<EquipamentoFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setFilterDialogOpen(false);
        }}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <EquipamentoFilter draft={draft} setDraft={setDraft} />}
      />
    </MainCard>
  );
};

export default EquipamentoPage;
