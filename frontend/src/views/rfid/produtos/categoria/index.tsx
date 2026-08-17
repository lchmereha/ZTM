// packages
import { useCallback, useMemo, useRef, useState } from 'react';
import * as yup from 'yup';

// icons
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import SearchIcon from '@mui/icons-material/Search';

// material-ui
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
import { useSnackbar } from 'hooks/useSnackbar';
import { categoriaEndpoint, dataTablesParam } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';

import { usePermissions } from 'hooks/usePermissions';
import CategoriaForm, { type ICategoriaForm } from './Form';

const CategoriaPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_CATEGORIA');

  const theme = useTheme();
  const { activeFilial } = useAuth();
  const contextFilter = useContextFilter('empresa');
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ICategoriaForm | null>(null);

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Converter estado da busca -> DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    return result;
  }, []);

  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${categoriaEndpoint}${dataTablesParam}`, payload);
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

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = useCallback(
    async (item: ICategoriaForm) => {
      try {
        const { data } = await axios.get(`${categoriaEndpoint}/${item.id}`);
        setSelectedItem(Array.isArray(data) ? data[0] : data);
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: ICategoriaForm) => {
      try {
        const payload: Record<string, unknown> = {
          nome: values.nome
        };

        if (!selectedItem && activeFilial) {
          payload.idEmpresa = activeFilial.idEmpresa;
        }

        if (selectedItem) {
          await axios.patch(`${categoriaEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(categoriaEndpoint, payload);
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
    (item: ICategoriaForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Deseja realmente excluir a categoria "${item.nome}"? Esta ação não pode ser desfeita.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${categoriaEndpoint}/${item.id}`);
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
      { title: 'ID', data: 'id', width: '0px' },
      { title: 'Nome', data: 'nome' }
    ],
    []
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        nome: yup.string().required('O nome é obrigatório')
      }),
    []
  );

  const initialValues: ICategoriaForm = useMemo(
    () => ({
      id: 0,
      nome: ''
    }),
    []
  );

  return (
    <MainCard
      title="Categorias"
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

          {/* Adicionar */}
          {podeIncluir && (
            <Grid size="auto">
              <Tooltip title="Cadastrar nova Categoria">
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
      <DataTable<ICategoriaForm>
        ref={tableRef}
        columns={columns}
        search={debouncedSearch}
        filters={filters}
        onFetchData={handleFetchData}
        contextFilter={contextFilter}
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
        <DataTableDialog<ICategoriaForm>
          maxWidth="sm"
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          item={selectedItem}
          validationSchema={validationSchema}
          initialValues={initialValues}
          renderForm={() => <CategoriaForm />}
          title={selectedItem ? 'Editar Categoria' : 'Adicionar Categoria'}
        />
      )}
    </MainCard>
  );
};

export default CategoriaPage;
