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
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// project imports
import { useAuth } from 'contexts/AuthContext';
import { useContextFilter } from 'hooks/useContextFilter';
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { usePermissions } from 'hooks/usePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { dataTablesParam, produtoEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, DataTableFilterDialog, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import ProdutoFilter, { emptyFilters, type ProdutoFilters } from './Filter';
import ProdutoForm, { type IProdutoForm } from './Form';

// ==============================|| PAGE - PRODUTO ||============================== //

const ProdutoPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_PRODUTO');

  const theme = useTheme();
  const { activeFilial } = useAuth();
  const contextFilter = useContextFilter('empresa');
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IProdutoForm | null>(null);

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  // Filtros avançados
  const [appliedFilters, setAppliedFilters] = useState<ProdutoFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Contagem de filtros aplicados
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.codigo.trim()) count++;
    if (appliedFilters.nome.trim()) count++;
    if (appliedFilters.unidadeMedida.trim()) count++;
    if (appliedFilters.idCategoria.length > 0) count++;
    if (appliedFilters.idModeloEtiqueta.length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Converter estado da busca -> DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    if (appliedFilters.codigo.trim()) {
      result.push({ field: 'codigo', type: 'contains', value: appliedFilters.codigo.trim() });
    }
    if (appliedFilters.nome.trim()) {
      result.push({ field: 'nome', type: 'contains', value: appliedFilters.nome.trim() });
    }
    if (appliedFilters.unidadeMedida.trim()) {
      result.push({ field: 'unidadeMedida', type: 'contains', value: appliedFilters.unidadeMedida.trim() });
    }
    if (appliedFilters.idCategoria.length > 0) {
      result.push({ field: 'idCategoria', type: 'in', value: appliedFilters.idCategoria });
    }
    if (appliedFilters.idModeloEtiqueta.length > 0) {
      result.push({ field: 'idModeloEtiqueta', type: 'in', value: appliedFilters.idModeloEtiqueta });
    }
    return result;
  }, [appliedFilters]);

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${produtoEndpoint}${dataTablesParam}`, payload);
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
    async (item: IProdutoForm) => {
      try {
        const { data } = await axios.get(`${produtoEndpoint}/${item.id}`);
        setSelectedItem(Array.isArray(data) ? data[0] : data);
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: IProdutoForm) => {
      try {
        const payload: Record<string, unknown> = {
          codigo: values.codigo,
          nome: values.nome,
          unidadeMedida: values.unidadeMedida,
          idCategoria: values.idCategoria,
          idModeloEtiqueta: values.idModeloEtiqueta || null
        };

        if (!selectedItem && activeFilial) {
          payload.idEmpresa = activeFilial.idEmpresa;
        }

        if (selectedItem) {
          await axios.patch(`${produtoEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(produtoEndpoint, payload);
        }
        setDialogOpen(false);
        showSnackbar({ message: 'Salvo com sucesso!', severity: 'success' });
        tableRef.current?.reload();
      } catch (err) {
        handleError(err);
      }
    },
    [selectedItem, activeFilial, showSnackbar, handleError]
  );

  const handleDelete = useCallback(
    (item: IProdutoForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Tem certeza que deseja excluir o produto "${item.nome}"?`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${produtoEndpoint}/${item.id}`);
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
      { title: 'SKU', data: 'codigo' },
      { title: 'Produto', data: 'nome' },
      { title: 'Categoria', data: 'categoria.nome' },
      { title: 'U.M.', data: 'unidadeMedida', width: '80px' }
    ],
    []
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        codigo: yup.string().required('Código obrigatório'),
        nome: yup.string().required('Nome obrigatório'),
        unidadeMedida: yup.string().required('U.M. obrigatória')
      }),
    []
  );

  const initialValues: IProdutoForm = useMemo(
    () => ({
      id: 0,
      codigo: '',
      nome: '',
      unidadeMedida: 'UN',
      idCategoria: undefined,
      idModeloEtiqueta: undefined
    }),
    []
  );

  return (
    <MainCard
      title="Catálogo de Produtos"
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
              <Tooltip title="Cadastrar novo Produto">
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
      <DataTable<IProdutoForm>
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
        <DataTableDialog<IProdutoForm>
          open={dialogOpen}
          maxWidth="md"
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          item={selectedItem}
          validationSchema={validationSchema}
          initialValues={initialValues}
          renderForm={() => <ProdutoForm />}
          title={selectedItem ? 'Editar Produto' : 'Adicionar Produto'}
        />
      )}

      {/* Diálogo de Filtros Avançados */}
      <DataTableFilterDialog<ProdutoFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setFilterDialogOpen(false);
        }}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <ProdutoFilter draft={draft} setDraft={setDraft} />}
      />
    </MainCard>
  );
};

export default ProdutoPage;
