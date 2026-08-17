// packages
import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';

// icons
import AutorenewIcon from '@mui/icons-material/Autorenew';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { useErrorHandler } from 'hooks/useErrorHandler';
import { filialEndpoint, usuarioEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// ==============================|| FORM INTERFACE ||============================== //

interface IApiKeyForm {
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

// ==============================|| FORM - API KEY ||============================== //

const ApiKeyForm = () => {
  const { values, setFieldValue, errors, touched, handleBlur } = useFormikContext<IApiKeyForm>();
  const handleError = useErrorHandler();
  const [filiais, setFiliais] = useState<{ id: number; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string; usuario: string; filiais: { id: number; nome: string }[] }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resFiliais, resUsuarios] = await Promise.all([axios.get(filialEndpoint), axios.get(usuarioEndpoint)]);
        setFiliais(Array.isArray(resFiliais.data) ? resFiliais.data : []);
        setUsuarios(Array.isArray(resUsuarios.data) ? resUsuarios.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [handleError]);

  const selectedUsuario = usuarios.find((u) => u.id === values.idUsuario);
  const filiaisFiltradas = filiais.filter((f) => selectedUsuario?.filiais.some((uf) => uf.id === f.id));

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Autocomplete
          options={usuarios}
          getOptionLabel={(option) => (option.nome ? `${option.nome} (${option.usuario})` : option.usuario)}
          value={selectedUsuario || null}
          onChange={(_e, newValue) => {
            setFieldValue('idUsuario', newValue ? newValue.id : '');

            // Se o usuário selecionado tiver filiais, seleciona a primeira automaticamente
            if (newValue && newValue.filiais && newValue.filiais.length > 0) {
              setFieldValue('idFilial', newValue.filiais[0].id);
            } else {
              setFieldValue('idFilial', '');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Usuário"
              margin="none"
              size="small"
              error={touched.idUsuario && Boolean(errors.idUsuario)}
              helperText={touched.idUsuario && errors.idUsuario}
            />
          )}
        />
      </Grid>

      <Grid size={12}>
        <Autocomplete
          disabled={!values.idUsuario}
          options={filiaisFiltradas}
          getOptionLabel={(option) => option.nome || ''}
          value={filiaisFiltradas.find((f) => f.id === values.idFilial) || null}
          onChange={(_e, newValue) => setFieldValue('idFilial', newValue ? newValue.id : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filial"
              margin="none"
              size="small"
              error={touched.idFilial && Boolean(errors.idFilial)}
              helperText={!values.idUsuario ? 'Selecione um usuário primeiro' : touched.idFilial && errors.idFilial}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextField
          error={touched.chave && Boolean(errors.chave)}
          fullWidth
          helperText={touched.chave && errors.chave}
          label="Chave"
          margin="none"
          minRows={3}
          multiline
          name="chave"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('chave', e.target.value.toUpperCase())}
          onBlur={handleBlur}
          size="small"
          value={values.chave}
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', textTransform: 'uppercase' },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Gerar nova chave">
                    <IconButton size="small" onClick={() => setFieldValue('chave', generateKey())} edge="end">
                      <AutorenewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }
          }}
        />
      </Grid>
    </Grid>
  );
};

export default ApiKeyForm;
