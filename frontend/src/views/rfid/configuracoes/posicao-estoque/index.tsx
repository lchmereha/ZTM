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
import { posicaoEstoqueEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, dtColumnAtivo, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';

import { usePermissions } from 'hooks/usePermissions';
import PosicaoEstoqueForm, { type IPosicaoEstoqueForm } from './Form';

const PosicaoEstoquePage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_POSICAO_ESTOQUE');

  const theme = useTheme();
  const { activeFilial } = useAuth();
  const contextFilter = useContextFilter('filial');
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IPosicaoEstoqueForm | null>(null);

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

  const handleFetchData = useCallback(
    async (data: Record<string, unknown>) => {
      // In many endpoints datatables param might not be supported if we didn't add it in the backend
      // Since we just wrote a standard get all, we will fetch and filter client-side for simplicity,
      // or just pass it to the GET endpoint. Wait, the DataTable component expects standard API if we don't have /datatables
      // Actually the standard is GET /posicao-estoque?idFilial=...
      const filialFilter = contextFilter?.value ? `?idFilial=${contextFilter.value}` : '';
      const response = await axios.get(`${posicaoEstoqueEndpoint}${filialFilter}`);
      // mock datatables structure since backend doesn't have /datatables implemented for this entity yet
      let records = response.data || [];
      if (debouncedSearch) {
        records = records.filter((r: IPosicaoEstoqueForm) => r.nome?.toLowerCase().includes(debouncedSearch.toLowerCase()));
      }
      return {
        data: records,
        recordsTotal: records.length,
        recordsFiltered: records.length,
        draw: Number(data.draw || 1)
      };
    },
    [contextFilter, debouncedSearch]
  );

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
    async (item: IPosicaoEstoqueForm) => {
      try {
        const { data } = await axios.get(`${posicaoEstoqueEndpoint}/${item.id}`);
        setSelectedItem(Array.isArray(data) ? data[0] : data);
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: IPosicaoEstoqueForm) => {
      try {
        const payload: Record<string, unknown> = {
          nome: values.nome,
          ativo: values.ativo
        };

        if (!selectedItem && activeFilial) {
          payload.idFilial = activeFilial.idFilial;
        }

        if (selectedItem) {
          await axios.patch(`${posicaoEstoqueEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(posicaoEstoqueEndpoint, payload);
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
    (item: IPosicaoEstoqueForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Deseja realmente excluir a Posição de Estoque "${item.nome}"? Esta ação não pode ser desfeita.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${posicaoEstoqueEndpoint}/${item.id}`);
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

  const columns = useMemo(() => [{ title: 'ID', data: 'id', width: '0px' }, { title: 'Nome', data: 'nome' }, dtColumnAtivo()], []);

  const validationSchema = useMemo(
    () =>
      yup.object({
        nome: yup.string().required('O nome é obrigatório')
      }),
    []
  );

  const initialValues: IPosicaoEstoqueForm = useMemo(
    () => ({
      id: 0,
      nome: '',
      ativo: true
    }),
    []
  );

  return (
    <MainCard
      title="Posição de Estoque"
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
              <Tooltip title="Cadastrar nova Posição de Estoque">
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
      <DataTable<IPosicaoEstoqueForm>
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
        <DataTableDialog<IPosicaoEstoqueForm>
          maxWidth="sm"
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          item={selectedItem}
          validationSchema={validationSchema}
          initialValues={initialValues}
          renderForm={() => <PosicaoEstoqueForm />}
          title={selectedItem ? 'Editar Posição de Estoque' : 'Adicionar Posição de Estoque'}
        />
      )}
    </MainCard>
  );
};

export default PosicaoEstoquePage;
