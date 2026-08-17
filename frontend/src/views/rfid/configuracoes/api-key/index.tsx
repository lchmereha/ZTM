// packages
import { useCallback, useMemo, useRef, useState } from 'react';
import * as yup from 'yup';

// icons
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { usePermissions } from 'hooks/usePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { apiKeyEndpoint, dataTablesParam } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, DataTableDialog } from 'ui-component/datatable';
import axios from 'utils/axios';
import ApiKeyForm from './Form';

// ==============================|| FORM INTERFACE ||============================== //

export interface IApiKeyForm {
  id: number;
  idFilial: number;
  idUsuario: number;
  chave: string;
}

// ==============================|| UTILS ||============================== //

const generateKey = (): string => {
  const bytes = new Uint8Array(64); // 64 bytes = 128 hex chars
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

// ==============================|| PAGE - API KEY ||============================== //

const ApiKeyPage = () => {
  const { podeIncluir, podeAlterar, podeExcluir } = usePermissions('CAD_API_KEY');

  const theme = useTheme();
  const tableRef = useRef<{ reload: () => void }>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IApiKeyForm | null>(null);
  const [generatedKey, setGeneratedKey] = useState('');

  // Busca global
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  const handleFetchData = useCallback(async (data: Record<string, unknown>) => {
    const response = await axios.post(`${apiKeyEndpoint}${dataTablesParam}`, data);
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
    setGeneratedKey(generateKey());
    setDialogOpen(true);
  };

  const handleOpenEdit = useCallback(
    async (item: IApiKeyForm) => {
      try {
        const { data } = await axios.get(`${apiKeyEndpoint}/${item.id}`);
        const apiKey = Array.isArray(data) ? data[0] : data;
        setSelectedItem(apiKey);
        setGeneratedKey('');
        setDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleSubmit = useCallback(
    async (values: IApiKeyForm) => {
      try {
        const payload = {
          idFilial: values.idFilial,
          idUsuario: values.idUsuario,
          chave: values.chave
        };

        if (selectedItem) {
          await axios.patch(`${apiKeyEndpoint}/${selectedItem.id}`, payload);
        } else {
          await axios.post(apiKeyEndpoint, payload);
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

  const handleCopy = useCallback(
    (item: IApiKeyForm & { chave: string }) => {
      navigator.clipboard.writeText(item.chave);
      showSnackbar({ message: 'Chave copiada para a área de transferência!', severity: 'success' });
    },
    [showSnackbar]
  );

  const handleDelete = useCallback(
    (item: IApiKeyForm) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Exclusão',
        content: `Deseja realmente excluir esta API Key? Esta ação não pode ser desfeita.`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Cancelar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.delete(`${apiKeyEndpoint}/${item.id}`);
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
      { title: 'Filial', data: 'filial.nome' },
      { title: 'Usuário', data: 'usuario.nome' },
      {
        title: 'Chave',
        data: 'chave',
        width: '240px',
        render: (data: string, type: string) =>
          type === 'display' && data
            ? `<span style="font-family: monospace;">${data.substring(0, 16)}…${data.substring(data.length - 8)}</span>`
            : data
      },
      {
        title: 'Criado em',
        data: 'createdAt',
        render: (data: string, type: string) => {
          if (type === 'display' && data) {
            const date = new Date(data);
            return date.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          return data;
        }
      }
    ],
    []
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        idFilial: yup.number().required('Selecione uma Filial'),
        idUsuario: yup.number().required('Selecione um Usuário'),
        chave: yup
          .string()
          .required('A chave é obrigatória')
          .matches(/^[A-F0-9]+$/, 'A chave deve conter apenas caracteres hexadecimais')
          .test('valid-key-length', 'O tamanho da chave deve ser 64, 96 ou 128 caracteres', (val) =>
            val ? [64, 96, 128].includes(val.length) : false
          )
      }),
    []
  );

  const initialValues: IApiKeyForm = useMemo(
    () => ({
      id: selectedItem?.id ?? 0,
      idFilial: selectedItem?.idFilial ?? 0,
      idUsuario: selectedItem?.idUsuario ?? 0,
      chave: selectedItem?.chave ?? generatedKey
    }),
    [selectedItem, generatedKey]
  );

  return (
    <MainCard
      title="API Keys"
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
              <Tooltip title="Cadastrar nova API Key">
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
      <DataTable<IApiKeyForm>
        ref={tableRef}
        columns={columns}
        search={debouncedSearch}
        onFetchData={handleFetchData}
        onError={handleError}
        rowActions={(item) => (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Tooltip title="Copiar Chave">
              <IconButton color="inherit" onClick={() => handleCopy(item as IApiKeyForm & { chave: string })} size="small">
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
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
        )}
      />

      {dialogOpen && (
        <DataTableDialog<IApiKeyForm>
          initialValues={initialValues}
          item={selectedItem}
          maxWidth="sm"
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          open={dialogOpen}
          renderForm={() => <ApiKeyForm />}
          title={selectedItem ? 'Editar API Key' : 'Adicionar API Key'}
          validationSchema={validationSchema}
        />
      )}
    </MainCard>
  );
};

export default ApiKeyPage;
