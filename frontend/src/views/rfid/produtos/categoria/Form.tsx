// packages
import { Field, useFormikContext } from 'formik';

// material-ui
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import type { CreateCategoriaDto } from 'interfaces';

export interface ICategoriaForm extends Omit<CreateCategoriaDto, 'idEmpresa'> {
  id: number;
}

const CategoriaForm = () => {
  const { errors, touched, setFieldValue } = useFormikContext<ICategoriaForm>();

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Field
          as={TextField}
          name="nome"
          label="Nome da Categoria"
          fullWidth
          margin="dense"
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
    </Grid>
  );
};

export default CategoriaForm;
