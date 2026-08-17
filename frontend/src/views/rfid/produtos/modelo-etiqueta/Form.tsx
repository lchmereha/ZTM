import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Field, useFormikContext } from 'formik';
import type { CreateModeloEtiquetaDto } from 'interfaces';

export interface IEtiquetaForm extends Omit<CreateModeloEtiquetaDto, 'idEmpresa'> {
  id: number;
}

const EtiquetaForm = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<IEtiquetaForm>();

  return (
    <Grid container spacing={2}>
      <Grid size="grow">
        <Field
          as={TextField}
          name="nome"
          label="Nome da Etiqueta"
          fullWidth
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size="auto" sx={{ mt: 0.9 }}>
        <FormControlLabel
          control={
            <Switch checked={values.ativo} size="small" onChange={(e) => setFieldValue('ativo', e.target.checked)} color="primary" />
          }
          label="Etiqueta Ativa"
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Field
          as={TextField}
          name="codigoZPL"
          label="Código ZPL"
          fullWidth
          multiline
          rows={6}
          size="small"
          error={touched.codigoZPL && Boolean(errors.codigoZPL)}
          helperText={touched.codigoZPL && errors.codigoZPL}
          slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
        />
      </Grid>
    </Grid>
  );
};

export default EtiquetaForm;
