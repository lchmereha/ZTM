import { useFormikContext } from 'formik';

// MUI
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// Project
import type { IAssociacaoItemForm } from 'interfaces/movimentacao';

// Local
import { useProdutoOptions } from './useProdutoOptions';

// ── Component ───────────────────────────────────────────────

const AssociacaoItemForm = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<IAssociacaoItemForm>();
  const { produtos, loading } = useProdutoOptions();

  const selectedProduto = produtos.find((p) => p.codigo === values.codigo) || null;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          size="small"
          options={produtos}
          loading={loading}
          getOptionLabel={(option) => `${option.codigo} — ${option.nome}`}
          value={selectedProduto}
          onChange={(_e, newValue) => {
            if (newValue) {
              setFieldValue('codigo', newValue.codigo);
              setFieldValue('nome', newValue.nome);
              setFieldValue('unidadeMedida', newValue.unidadeMedida);
              setFieldValue('categoria', newValue.categoria?.nome || '');
            } else {
              setFieldValue('codigo', '');
              setFieldValue('nome', '');
              setFieldValue('unidadeMedida', '');
              setFieldValue('categoria', '');
            }
          }}
          isOptionEqualToValue={(option, val) => option.codigo === val.codigo}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Produto"
              size="small"
              error={touched.codigo && Boolean(errors.codigo)}
              helperText={touched.codigo && errors.codigo}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          name="quantidade"
          label="Quantidade"
          type="number"
          fullWidth
          size="small"
          value={values.quantidade}
          onChange={(e) => setFieldValue('quantidade', Math.max(1, Number(e.target.value)))}
          error={touched.quantidade && Boolean(errors.quantidade)}
          helperText={touched.quantidade && errors.quantidade}
          slotProps={{ htmlInput: { min: 1 } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          name="qtdeUMVolume"
          label="Qtde. UM/Volume"
          type="number"
          fullWidth
          size="small"
          value={values.qtdeUMVolume ?? ''}
          onChange={(e) => setFieldValue('qtdeUMVolume', e.target.value ? Number(e.target.value) : null)}
        />
      </Grid>

      {/* Read-only info fields */}
      {selectedProduto && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Unidade de Medida" value={values.unidadeMedida} size="small" fullWidth disabled />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Categoria" value={values.categoria} size="small" fullWidth disabled />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default AssociacaoItemForm;
