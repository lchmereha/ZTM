import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Field, useFormikContext } from 'formik';

export interface IPosicaoEstoqueForm {
  id: number;
  nome: string;
  ativo: boolean;
}

const PosicaoEstoqueForm = () => {
  const { setFieldValue, errors, touched, values } = useFormikContext<IPosicaoEstoqueForm>();

  return (
    <Grid container columnSpacing={2} rowSpacing={1} sx={{ marginTop: 0.5 }}>
      <Grid size="grow">
        <Field
          as={TextField}
          name="nome"
          label="Nome"
          fullWidth
          margin="dense"
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const normalized = raw
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toUpperCase();
            setFieldValue('nome', normalized);
          }}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size="auto">
        <FormControlLabel
          control={
            <Switch checked={values.ativo} onChange={(e) => setFieldValue('ativo', e.target.checked)} name="ativo" color="primary" />
          }
          label="Ativo"
          sx={{ mt: 1 }}
        />
      </Grid>
    </Grid>
  );
};

export default PosicaoEstoqueForm;
