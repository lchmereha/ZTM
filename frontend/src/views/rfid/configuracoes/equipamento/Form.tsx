// packages
import { Field, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useErrorHandler } from 'hooks/useErrorHandler';
import type { CreateEquipamentoDto } from 'interfaces';
import { TipoEquipamento } from 'models';
import { filialEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface IEquipamentoForm extends CreateEquipamentoDto {
  id: number;
}

const tiposEquipamento = Object.values(TipoEquipamento);

const EquipamentoForm = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<IEquipamentoForm>();
  const [filiais, setFiliais] = useState<{ id: number; nome: string }[]>([]);
  const handleError = useErrorHandler();

  useEffect(() => {
    const loadFiliais = async () => {
      try {
        const { data } = await axios.get(filialEndpoint);
        setFiliais(Array.isArray(data) ? data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadFiliais();
  }, [handleError]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Field
          as={TextField}
          name="nome"
          label="Nome"
          fullWidth
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          getOptionLabel={(option) => option.nome || ''}
          onChange={(_e, newValue) => setFieldValue('idFilial', newValue ? newValue.id : '')}
          options={filiais}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filial"
              size="small"
              error={touched.idFilial && Boolean(errors.idFilial)}
              helperText={touched.idFilial && errors.idFilial}
            />
          )}
          value={filiais.find((f) => f.id === values.idFilial) || null}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          options={tiposEquipamento}
          value={values.tipo || null}
          onChange={(_e, newValue) => setFieldValue('tipo', newValue || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tipo"
              size="small"
              error={touched.tipo && Boolean(errors.tipo)}
              helperText={touched.tipo && errors.tipo}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Field as={TextField} name="ipConexao" label="IP de Conexão" fullWidth size="small" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field as={TextField} name="portaConexao" label="Porta" type="number" fullWidth size="small" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControlLabel
          control={<Checkbox checked={values.ativo ?? true} onChange={(e) => setFieldValue('ativo', e.target.checked)} />}
          label="Ativo"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={values.exibeConexaoSocket ?? false}
              onChange={(e) => setFieldValue('exibeConexaoSocket', e.target.checked)}
            />
          }
          label="Exibir Conexão Socket"
        />
      </Grid>
    </Grid>
  );
};

export default EquipamentoForm;
