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
import { useSnackbar } from 'hooks/useSnackbar';
import { modeloEtiquetaEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, DataTableFilterDialog, dtColumnAtivo, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import EtiquetaForm, { type IEtiquetaForm } from './Form';

// ==============================|| FILTROS - MODELO ETIQUETA ||============================== //

import { usePermissions } from 'hooks/usePermissions';
import EtiquetaFilter, { emptyFilters, type EtiquetaFilters } from './Filter';

// validation schema
const validationSchema = yup.object({
  nome: yup.string().required('Nome é obrigatório'),
  codigoZPL: yup.string().required('Código ZPL é obrigatório')
});

const EtiquetaIndex = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_ETIQUETA_MODELO');

  const theme = useTheme();
  const { activeFilial } = useAuth();
  const contextFilter = useContextFilter('empresa');
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IEtiquetaForm | null>(null);
  const tableRef = useRef<{ reload: () => void }>(null);
  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtros avançados
  const [appliedFilters, setAppliedFilters] = useState<EtiquetaFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Contagem de filtros aplicados
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.nome.trim()) count++;
    if (appliedFilters.codigoZPL.trim()) count++;
    if (appliedFilters.ativo !== '') count++;
    return count;
  }, [appliedFilters]);

  // Converter estado da busca -> DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    if (appliedFilters.nome.trim()) {
      result.push({ field: 'nome', type: 'contains', value: appliedFilters.nome.trim() });
    }
    if (appliedFilters.codigoZPL.trim()) {
      result.push({ field: 'codigoZPL', type: 'contains', value: appliedFilters.codigoZPL.trim() });
    }
    if (appliedFilters.ativo !== '') {
      result.push({ field: 'ativo', type: 'equals', value: appliedFilters.ativo });
    }
    return result;
  }, [appliedFilters]);

  const initialValues: IEtiquetaForm = {
    id: 0,
    nome: '',
    codigoZPL: '',
    ativo: true
  };

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const res = await axios.post(`${modeloEtiquetaEndpoint}/datatables`, payload);
    return res.data;
  }, []);

  // Debounce da busca global
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const handleOpen = async (item: IEtiquetaForm | null = null) => {
    if (!item) {
      setSelectedItem(null);
      setOpen(true);
      return;
    }
    try {
      const { data } = await axios.get(`${modeloEtiquetaEndpoint}/${item.id}`);
      setSelectedItem(Array.isArray(data) ? data[0] : data);
      setOpen(true);
    } catch (err) {
      handleError(err);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = async (values: IEtiquetaForm) => {
    try {
      const payload: Record<string, unknown> = {
        nome: values.nome,
        codigoZPL: values.codigoZPL,
        ativo: values.ativo
      };

      if (!selectedItem && activeFilial) {
        payload.idEmpresa = activeFilial.idEmpresa;
      }

      if (values.id) {
        await axios.patch(`${modeloEtiquetaEndpoint}/${values.id}`, payload);
        showSnackbar({ message: 'Etiqueta atualizada com sucesso!', severity: 'success' });
      } else {
        await axios.post(modeloEtiquetaEndpoint, payload);
        showSnackbar({ message: 'Etiqueta cadastrada com sucesso!', severity: 'success' });
      }
      handleClose();
      tableRef.current?.reload();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = useCallback(
    (item: IEtiquetaForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Deseja realmente excluir a etiqueta "${item.nome}"? Esta ação não pode ser desfeita.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${modeloEtiquetaEndpoint}/${item.id}`);
                tableRef.current?.reload();
                showSnackbar({ message: 'Etiqueta excluída com sucesso!', severity: 'success' });
                closeDialog();
              } catch (error) {
                handleError(error);
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

  return (
    <MainCard
      title="Etiquetas"
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
              <Tooltip title="Cadastrar nova Etiqueta">
                <IconButton
                  size="small"
                  onClick={() => handleOpen()}
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
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any */}
      <DataTable<any>
        ref={tableRef}
        columns={columns}
        search={debouncedSearch}
        filters={filters}
        onFetchData={handleFetchData}
        contextFilter={contextFilter}
        rowActions={
          podeAlterar || podeExcluir
            ? (item) => (
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  {podeAlterar && (
                    <Tooltip title="Editar">
                      <IconButton color="inherit" onClick={() => handleOpen(item)} size="small">
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

      {open && (
        <DataTableDialog<IEtiquetaForm>
          open={open}
          onClose={handleClose}
          onSubmit={handleSubmit}
          item={selectedItem}
          initialValues={initialValues}
          validationSchema={validationSchema}
          renderForm={() => <EtiquetaForm />}
          title={selectedItem ? 'Editar Etiqueta' : 'Nova Etiqueta'}
          maxWidth="md"
        />
      )}
      {/* Diálogo de Filtros Avançados */}
      <DataTableFilterDialog<EtiquetaFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setFilterDialogOpen(false);
        }}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <EtiquetaFilter draft={draft} setDraft={setDraft} />}
      />
    </MainCard>
  );
};

export default EtiquetaIndex;
