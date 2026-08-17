import { Field, useFormikContext } from 'formik';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

const ImportItemForm = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
  const { setFieldValue, errors, touched } = useFormikContext<any>();

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="codigo"
          label="Código"
          fullWidth
          size="small"
          error={touched.codigo && Boolean(errors.codigo)}
          helperText={touched.codigo && errors.codigo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('codigo', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Field
          as={TextField}
          name="nome"
          label="Nome"
          fullWidth
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="unidadeMedida"
          label="Unidade de Medida"
          fullWidth
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('unidadeMedida', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field as={TextField} name="quantidade" label="Quantidade" type="number" fullWidth size="small" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field as={TextField} name="qtdeUMVolume" label="Qtde. UM/Volume" type="number" fullWidth size="small" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="categoria"
          label="Categoria"
          fullWidth
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('categoria', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="posicaoEstoque"
          label="Posição de Estoque"
          fullWidth
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('posicaoEstoque', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="codigoUnico"
          label="Código Único"
          fullWidth
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('codigoUnico', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="lote"
          label="Lote"
          fullWidth
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('lote', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="dataValidade"
          label="Data de Validade"
          type="date"
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="dataFabricacao"
          label="Data de Fabricação"
          type="date"
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
    </Grid>
  );
};

export default ImportItemForm;
