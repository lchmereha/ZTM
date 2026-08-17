import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Field, useFormikContext } from 'formik';
import type { CreateTipoMovimentacaoDto } from 'interfaces';
import { TipoOpcaoMovimentacao } from 'models';

export interface ITipoMovimentacaoForm extends Omit<CreateTipoMovimentacaoDto, 'idEmpresa'> {
  id: number;
}

const tiposOpcao = Object.values(TipoOpcaoMovimentacao);
const tiposQueFazemBaixa: TipoOpcaoMovimentacao[] = [
  TipoOpcaoMovimentacao.LEITURA,
  TipoOpcaoMovimentacao.CONFERENCIA,
  TipoOpcaoMovimentacao.TRANSFERENCIA
];

const TipoMovimentacaoForm = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<ITipoMovimentacaoForm>();

  const podeExibirFazBaixa = tiposQueFazemBaixa.includes(values.tipo as TipoOpcaoMovimentacao);

  const handleTipoChange = (_e: React.SyntheticEvent, newValue: string | null) => {
    setFieldValue('tipo', newValue || '');
    if (!newValue || !tiposQueFazemBaixa.includes(newValue as TipoOpcaoMovimentacao)) {
      setFieldValue('fazBaixa', false);
    } else {
      setFieldValue('fazBaixa', true);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Field
          as={TextField}
          name="descricao"
          label="Descrição do Tipo de Movimentação"
          fullWidth
          size="small"
          error={touched.descricao && Boolean(errors.descricao)}
          helperText={touched.descricao && errors.descricao}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('descricao', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 'grow' }}>
        <Autocomplete
          options={tiposOpcao}
          value={values.tipo || null}
          onChange={handleTipoChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tipo de Operação"
              size="small"
              error={touched.tipo && Boolean(errors.tipo)}
              helperText={touched.tipo && errors.tipo}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 6, md: 'auto' }} sx={{ alignSelf: 'center' }}>
        <FormControlLabel
          control={<Checkbox checked={values.ativo ?? true} onChange={(e) => setFieldValue('ativo', e.target.checked)} size="small" />}
          label="Ativo"
        />
      </Grid>

      {podeExibirFazBaixa && (
        <Grid size={{ xs: 6, md: 'auto' }} sx={{ alignSelf: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox checked={values.fazBaixa ?? false} onChange={(e) => setFieldValue('fazBaixa', e.target.checked)} size="small" />
            }
            label="Faz Baixa de Tags"
          />
        </Grid>
      )}
    </Grid>
  );
};

export default TipoMovimentacaoForm;
