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
import Chip from '@mui/material/Chip';
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
import { dataTablesParam, tagRfidEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, DataTableFilterDialog, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import TagRfidForm, { type ITagRfidForm } from './Form';

// ==============================|| FILTROS - TAG RFID ||============================== //

import { usePermissions } from 'hooks/usePermissions';
import TagRfidFilter, { emptyFilters, type TagFilters } from './Filter';

// ==============================|| PAGE - TAG RFID ||============================== //

const TagRfidPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_TAG_RFID');

  const theme = useTheme();
  const { activeFilial } = useAuth();
  const contextFilter = useContextFilter('filial');
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ITagRfidForm | null>(null);

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  // Filtros avançados
  const [appliedFilters, setAppliedFilters] = useState<TagFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Contagem de filtros aplicados
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.codigoRfid.trim()) count++;
    if (appliedFilters.codigoUnico.trim()) count++;
    if (appliedFilters.lote.trim()) count++;
    if (appliedFilters.idProduto.length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Converter estado da busca -> DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];
    if (appliedFilters.codigoRfid.trim()) {
      result.push({ field: 'codigoRfid', type: 'contains', value: appliedFilters.codigoRfid.trim() });
    }
    if (appliedFilters.codigoUnico.trim()) {
      result.push({ field: 'codigoUnico', type: 'contains', value: appliedFilters.codigoUnico.trim() });
    }
    if (appliedFilters.lote.trim()) {
      result.push({ field: 'lote', type: 'contains', value: appliedFilters.lote.trim() });
    }
    if (appliedFilters.idProduto.length > 0) {
      result.push({ field: 'idProduto', type: 'in', value: appliedFilters.idProduto });
    }
    return result;
  }, [appliedFilters]);

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${tagRfidEndpoint}${dataTablesParam}`, payload);
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
    async (item: ITagRfidForm) => {
      try {
        const { data } = await axios.get(`${tagRfidEndpoint}/${item.id}`);
        const record = Array.isArray(data) ? data[0] : data;
        setSelectedItem({
          ...record,
          dataValidade: record.dataValidade ? record.dataValidade.substring(0, 10) : '',
          dataFabricacao: record.dataFabricacao ? record.dataFabricacao.substring(0, 10) : '',
          dataBaixa: record.dataBaixa ? record.dataBaixa.substring(0, 10) : ''
        });
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: ITagRfidForm) => {
      try {
        const payload: Record<string, unknown> = {
          codigoRfid: values.codigoRfid,
          codigoUnico: values.codigoUnico || null,
          lote: values.lote || null,
          dataValidade: values.dataValidade ? new Date(values.dataValidade).toISOString() : null,
          dataFabricacao: values.dataFabricacao ? new Date(values.dataFabricacao).toISOString() : null,
          dataBaixa: values.dataBaixa ? new Date(values.dataBaixa).toISOString() : null,
          idProduto: values.idProduto,
          idPosicaoEstoque: values.idPosicaoEstoque || null
        };

        if (!selectedItem && activeFilial) {
          payload.idFilial = activeFilial.idFilial;
        }

        if (selectedItem) {
          await axios.patch(`${tagRfidEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(tagRfidEndpoint, payload);
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
    (item: ITagRfidForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Tem certeza que deseja excluir a tag "${item.codigoRfid}"?`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${tagRfidEndpoint}/${item.id}`);
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
      { title: 'RFID', data: 'codigoRfid', width: '200px' },
      { title: 'Produto', data: 'produto.nome' },
      { title: 'Posição de Estoque', data: 'posicaoEstoque.nome', render: (data: string) => (data ? data : '-') },
      {
        title: 'Situação',
        data: 'dataBaixa',
        width: '160px',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables.net render callback receives untyped row data
        render: (item: any) => {
          if (item?.dataBaixa) {
            const d = new Date(item.dataBaixa);
            const formatted = d.toLocaleDateString('pt-BR');
            return <Chip label={`Baixada ${formatted}`} color="info" size="small" variant="filled" />;
          }
          return <Chip label="Ativa" color="success" size="small" variant="filled" />;
        }
      }
    ],
    []
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        codigoRfid: yup.string().required('O Código RFID é obrigatório'),
        idProduto: yup.number().required('O produto é obrigatório')
      }),
    []
  );

  const initialValues: ITagRfidForm = useMemo(
    () => ({
      id: 0,
      codigoRfid: '',
      idProduto: 0,
      codigoUnico: undefined,
      dataValidade: undefined,
      lote: undefined,
      dataFabricacao: undefined,
      dataBaixa: undefined,
      idPosicaoEstoque: undefined
    }),
    []
  );

  return (
    <MainCard
      title="Tags RFID"
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
              <Tooltip title="Cadastrar nova Tag">
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
      <DataTable<ITagRfidForm>
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
        <DataTableDialog<ITagRfidForm>
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          item={selectedItem}
          validationSchema={validationSchema}
          initialValues={initialValues}
          maxWidth="md"
          renderForm={() => <TagRfidForm />}
          title={selectedItem ? 'Editar Tag RFID' : 'Adicionar Tag RFID'}
        />
      )}

      {/* Diálogo de Filtros Avançados */}
      <DataTableFilterDialog<TagFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setFilterDialogOpen(false);
        }}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <TagRfidFilter draft={draft} setDraft={setDraft} />}
      />
    </MainCard>
  );
};

export default TagRfidPage;
