// packages
import { type ConfigColumns } from 'datatables.net-dt';
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
import { useContextFilter } from 'hooks/useContextFilter';
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { usePermissions } from 'hooks/usePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { dataTablesParam, filialEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, DataTableFilterDialog, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import FilialFilter, { emptyFilters, type FilialFilters } from './Filter';
import FilialForm, { type IFilialForm } from './Form';

// ==============================|| PAGE - FILIAL ||============================== //

const FilialPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_FILIAL');

  const theme = useTheme();
  const contextFilter = useContextFilter('empresa');
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IFilialForm | null>(null);

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  // Filtros avançados
  const [appliedFilters, setAppliedFilters] = useState<FilialFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Contagem de filtros aplicados
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.nome.trim()) count++;
    if (appliedFilters.documentoIdentificacao.trim()) count++;
    if (appliedFilters.cidade.trim()) count++;
    if (appliedFilters.estado.trim()) count++;
    if (appliedFilters.telefone.trim()) count++;
    if (appliedFilters.idEmpresa.length > 0) count++;
    if (appliedFilters.idEtiquetaPadrao.length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Converter estado da busca -> DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    if (appliedFilters.nome.trim()) {
      result.push({ field: 'nome', type: 'contains', value: appliedFilters.nome.trim() });
    }
    if (appliedFilters.documentoIdentificacao.trim()) {
      result.push({ field: 'documentoIdentificacao', type: 'contains', value: appliedFilters.documentoIdentificacao.trim() });
    }
    if (appliedFilters.cidade.trim()) {
      result.push({ field: 'cidade', type: 'contains', value: appliedFilters.cidade.trim() });
    }
    if (appliedFilters.estado.trim()) {
      result.push({ field: 'estado', type: 'contains', value: appliedFilters.estado.trim() });
    }
    if (appliedFilters.telefone.trim()) {
      result.push({ field: 'telefone', type: 'contains', value: appliedFilters.telefone.trim() });
    }
    if (appliedFilters.idEmpresa.length > 0) {
      result.push({ field: 'idEmpresa', type: 'in', value: appliedFilters.idEmpresa });
    }
    if (appliedFilters.idEtiquetaPadrao.length > 0) {
      result.push({ field: 'idEtiquetaPadrao', type: 'in', value: appliedFilters.idEtiquetaPadrao });
    }
    return result;
  }, [appliedFilters]);

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${filialEndpoint}${dataTablesParam}`, payload);
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
    async (item: IFilialForm) => {
      try {
        const { data } = await axios.get(`${filialEndpoint}/${item.id}`);
        const filial = Array.isArray(data) ? data[0] : data;

        // Formatar CEP para a máscara (86800140 -> 86800-140)
        if (filial.cep) {
          filial.cep = filial.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
        }

        setSelectedItem(filial);
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: IFilialForm) => {
      try {
        const payload: Record<string, unknown> = {
          nome: values.nome,
          endereco: values.endereco,
          documentoIdentificacao: values.documentoIdentificacao,
          cidade: values.cidade,
          estado: values.estado,
          cep: values.cep?.replace(/\D/g, ''),
          numeroLogradouro: values.numeroLogradouro,
          telefone: values.telefone,
          idEtiquetaPadrao: values.idEtiquetaPadrao || null
        };

        if (!selectedItem) {
          payload.idEmpresa = values.idEmpresa;
        }

        if (selectedItem) {
          await axios.patch(`${filialEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(filialEndpoint, payload);
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
    (item: IFilialForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Deseja realmente excluir a filial "${item.nome}"? Esta ação não pode ser deitada.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${filialEndpoint}/${item.id}`);
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

  const columns = useMemo<ConfigColumns[]>(
    () => [
      { title: 'ID', data: 'id', width: '0px' },
      { title: 'Filial', data: 'nome' },
      { title: 'Matriz', data: 'empresa.nome' },
      { title: 'Documento', data: 'documentoIdentificacao', type: 'string' },
      {
        title: 'Cidade/UF',
        data: 'cidade',
        render: (data: string, type: string, item: IFilialForm) =>
          type === 'display' && item ? `${item.cidade || ''}/${item.estado || ''}` : data
      },
      { data: 'estado', visible: false }
    ],
    []
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        idEmpresa: yup.number().required('Selecione uma Empresa vinculada'),
        nome: yup.string().required('O nome é obrigatório')
      }),
    []
  );

  const initialValues: IFilialForm = useMemo(
    () => ({
      id: 0,
      idEmpresa: 0,
      nome: '',
      documentoIdentificacao: '',
      cep: '',
      endereco: '',
      numeroLogradouro: '',
      cidade: '',
      estado: '',
      telefone: '',
      idEtiquetaPadrao: undefined
    }),
    []
  );

  return (
    <MainCard
      title="Filiais"
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
              <Tooltip title="Cadastrar nova Filial">
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
      <DataTable<IFilialForm>
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
        <DataTableDialog<IFilialForm>
          initialValues={initialValues}
          item={selectedItem}
          maxWidth="lg"
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          open={dialogOpen}
          renderForm={() => <FilialForm />}
          title={selectedItem ? 'Editar Filial' : 'Adicionar Filial'}
          validationSchema={validationSchema}
        />
      )}

      {/* Diálogo de Filtros Avançados */}
      <DataTableFilterDialog<FilialFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setFilterDialogOpen(false);
        }}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <FilialFilter draft={draft} setDraft={setDraft} />}
      />
    </MainCard>
  );
};

export default FilialPage;
