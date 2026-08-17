import type { ConfigColumns } from 'datatables.net';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as yup from 'yup';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { usePermissions } from 'hooks/usePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import type { CreateUsuarioDto, UpdateUsuarioDto } from 'interfaces';
import { dataTablesParam, usuarioEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog, DataTableFilterDialog, type DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import type { UsuarioFilters } from './Filter';
import UsuarioFilter, { emptyFilters } from './Filter';
import UsuarioForm, { type IUsuarioForm } from './Form';

// ==============================|| FILTROS - USUARIO ||============================== //

// ==============================|| PAGE - USUARIOS ||============================== //

const UsuarioPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_USUARIO');

  const theme = useTheme();
  const tableRef = useRef<{ reload: () => void }>(null);
  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IUsuarioForm | null>(null);

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtros avançados — estado aplicado (o que o DataTable vê)
  const [appliedFilters, setAppliedFilters] = useState<UsuarioFilters>(emptyFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Contagem de filtros aplicados
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.nome.trim()) count++;
    if (appliedFilters.usuario.trim()) count++;
    if (appliedFilters.email.trim()) count++;
    if (appliedFilters.regras.length > 0) count++;
    if (appliedFilters.idFiliais.length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Converter estado aplicado → DTFilter[]
  const filters = useMemo<DTFilter[]>(() => {
    const result: DTFilter[] = [];

    if (appliedFilters.nome.trim()) {
      result.push({ field: 'nome', type: 'contains', value: appliedFilters.nome.trim() });
    }
    if (appliedFilters.usuario.trim()) {
      result.push({ field: 'usuario', type: 'contains', value: appliedFilters.usuario.trim() });
    }
    if (appliedFilters.email.trim()) {
      result.push({ field: 'email', type: 'contains', value: appliedFilters.email.trim() });
    }
    if (appliedFilters.regras.length > 0) {
      result.push({ field: 'regra', type: 'in', value: appliedFilters.regras });
    }
    if (appliedFilters.idFiliais.length > 0) {
      result.push({ field: 'idFiliais', type: 'in', value: appliedFilters.idFiliais });
    }

    return result;
  }, [appliedFilters]);

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

  const handleApplyFilters = (newFilters: UsuarioFilters) => {
    setAppliedFilters(newFilters);
    setFilterDialogOpen(false);
  };

  // CRUD handlers
  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${usuarioEndpoint}${dataTablesParam}`, payload);
    return response.data;
  }, []);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = useCallback(
    async (item: IUsuarioForm) => {
      try {
        const { data } = await axios.get(`${usuarioEndpoint}/${item.id}`);
        const loadedData = Array.isArray(data) ? data[0] : data;

        if (loadedData.filiais) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response array has untyped elements
          loadedData.idFiliais = loadedData.filiais.map((f: any) => f.id);
        } else {
          loadedData.idFiliais = [];
        }

        if (!loadedData.permissoes) {
          loadedData.permissoes = { visualizar: [], incluir: [], alterar: [], excluir: [] };
        }

        setSelectedItem(loadedData);
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: IUsuarioForm) => {
      try {
        const { nome, usuario, email, senha, regra, ativo, idFiliais, permissoes } = values;

        if (selectedItem) {
          const payload: UpdateUsuarioDto = {
            nome,
            usuario,
            email,
            regra,
            ativo,
            idFiliais,
            permissoes,
            ...(senha ? { senha } : {})
          };
          await axios.patch(`${usuarioEndpoint}/${selectedItem.id}`, payload);
        } else {
          const payload: CreateUsuarioDto = {
            nome,
            usuario,
            email,
            senha,
            regra,
            ativo,
            idFiliais,
            permissoes
          };
          await axios.post(usuarioEndpoint, payload);
        }
        setDialogOpen(false);
        tableRef.current?.reload();
        showSnackbar({ message: 'Usuário salvo com sucesso!', severity: 'success' });
      } catch (err) {
        handleError(err);
      }
    },
    [selectedItem, showSnackbar, handleError]
  );

  const handleDelete = useCallback(
    (item: IUsuarioForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Deseja realmente excluir o usuário "${item.nome || item.usuario}"? Esta ação não pode ser desfeita.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${usuarioEndpoint}/${item.id}`);
                tableRef.current?.reload();
                showSnackbar({ message: 'Usuário excluído com sucesso!', severity: 'success' });
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
      { title: 'Nome', data: 'nome' },
      { title: 'Usuário', data: 'usuario' },
      { title: 'E-mail', data: 'email', render: (data: string) => (data ? data : '-') },
      { title: 'Perfil', data: 'regra', width: '100px' }
    ],
    []
  );

  const validationSchema = useMemo(() => {
    return yup.object({
      nome: yup.string().nullable(),
      usuario: yup.string().required('Usuário é obrigatório'),
      senha: yup.string().when('id', {
        is: (val: number) => !val || val === 0,
        then: (schema) => schema.required('Senha é obrigatória'),
        otherwise: (schema) => schema.notRequired()
      }),
      confirmarSenha: yup.string().when(['id', 'senha'], {
        is: (id: number, senha: string) => !id || id === 0 || (senha && senha.length > 0),
        then: (schema) => schema.required('Confirmação de senha é obrigatória').oneOf([yup.ref('senha')], 'As senhas não coincidem'),
        otherwise: (schema) => schema.notRequired()
      }),
      regra: yup.string().required('Perfil é obrigatório'),
      email: yup
        .string()
        .email('E-mail inválido')
        .transform((value) => (value === '' ? null : value))
        .nullable()
    });
  }, []);

  const initialValues: IUsuarioForm = useMemo(
    () => ({
      id: 0,
      nome: '',
      usuario: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      regra: 'OPERADOR',
      ativo: true,
      idFiliais: [],
      permissoes: { visualizar: [], incluir: [], alterar: [], excluir: [] }
    }),
    []
  );

  return (
    <MainCard
      title="Gestão de Usuários"
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
                <Badge badgeContent={activeFilterCount} color="error" overlap="circular">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Grid>

          {/* Botão Adicionar */}
          {podeIncluir && (
            <Grid size="auto">
              <Tooltip title="Cadastrar novo Usuário">
                <IconButton
                  onClick={handleOpenAdd}
                  size="small"
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
      <DataTable<IUsuarioForm>
        ref={tableRef}
        columns={columns}
        search={debouncedSearch}
        filters={filters}
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
                      <IconButton onClick={() => handleDelete(item)} size="small" sx={{ color: theme.vars?.palette.md3.error }}>
                        <DeleteTwoToneIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )
            : undefined
        }
      />

      {/* Diálogo CRUD */}
      {dialogOpen && (
        <DataTableDialog<IUsuarioForm>
          open={dialogOpen}
          maxWidth="md"
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          item={selectedItem}
          validationSchema={validationSchema}
          initialValues={initialValues}
          renderForm={() => <UsuarioForm />}
          title={selectedItem ? 'Editar Usuário' : 'Cadastrar Usuário'}
        />
      )}

      {/* Diálogo de Filtros Avançados */}
      <DataTableFilterDialog<UsuarioFilters>
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleApplyFilters}
        appliedFilters={appliedFilters}
        emptyFilters={emptyFilters}
        renderForm={(draft, setDraft) => <UsuarioFilter draft={draft} setDraft={setDraft} />}
      />
    </MainCard>
  );
};

export default UsuarioPage;
