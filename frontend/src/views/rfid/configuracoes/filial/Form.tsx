// packages
import type { MaskitoOptions } from '@maskito/core';
import { useMaskito } from '@maskito/react';
import { Field, useFormikContext, type FieldProps } from 'formik';
import { forwardRef, useEffect, useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import type { CreateFilialDto } from 'interfaces';
import { ESTADOS_BRASILEIROS } from 'models';
import { empresaEndpoint, modeloEtiquetaEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface IFilialForm extends CreateFilialDto {
  id: number;
}

const PhoneTextField = forwardRef<HTMLInputElement, React.ComponentProps<typeof TextField>>((props, ref) => (
  <TextField {...props} inputRef={ref} fullWidth margin="none" size="small" label="Telefone" />
));

const FilialForm = () => {
  const { values, setFieldValue, errors, touched, handleBlur } = useFormikContext<IFilialForm>();
  const { showSnackbar } = useSnackbar();
  const handleError = useErrorHandler();
  const [empresas, setEmpresas] = useState<{ id: number; nome: string }[]>([]);
  const [etiquetas, setEtiquetas] = useState<{ id: number; nome: string }[]>([]);

  const cepMask: MaskitoOptions = {
    mask: [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/]
  };
  const cepRef = useMaskito({ options: cepMask });

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(e);
    const cep = values.cep?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
      try {
        const { data } = await axios.get(`/cep/${cep}`);
        if (!data.erro) {
          setFieldValue('endereco', data.logradouro);
          setFieldValue('cidade', data.localidade);
          setFieldValue('estado', data.uf);
        } else {
          showSnackbar({ message: 'CEP não encontrado.', severity: 'warning' });
        }
      } catch (err) {
        handleError(err);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empresasRes, etiquetasRes] = await Promise.all([axios.get(empresaEndpoint), axios.get(modeloEtiquetaEndpoint)]);
        setEmpresas(Array.isArray(empresasRes.data) ? empresasRes.data : []);
        setEtiquetas(Array.isArray(etiquetasRes.data) ? etiquetasRes.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [handleError]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          options={empresas}
          getOptionLabel={(option) => option.nome || ''}
          value={empresas.find((e) => e.id === values.idEmpresa) || null}
          onChange={(_e, newValue) => setFieldValue('idEmpresa', newValue ? newValue.id : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Empresa Vinculada"
              margin="none"
              size="small"
              error={touched.idEmpresa && Boolean(errors.idEmpresa)}
              helperText={touched.idEmpresa && errors.idEmpresa}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          options={etiquetas}
          getOptionLabel={(option) => option.nome || ''}
          value={etiquetas.find((e) => e.id === values.idEtiquetaPadrao) || null}
          onChange={(_e, newValue) => setFieldValue('idEtiquetaPadrao', newValue ? newValue.id : '')}
          renderInput={(params) => <TextField {...params} label="Etiqueta Padrão da Filial" margin="none" size="small" />}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="nome"
          label="Nome da Filial"
          fullWidth
          margin="none"
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Field
          as={TextField}
          name="documentoIdentificacao"
          label="Documento (CNPJ/IE)"
          fullWidth
          margin="none"
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('documentoIdentificacao', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <PhoneInput
          defaultCountry="BR"
          value={values.telefone ?? undefined}
          onChange={(val) => setFieldValue('telefone', val)}
          onBlur={handleBlur('telefone')}
          inputComponent={PhoneTextField}
          displayInitialValueAsLocalNumber
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3 }}>
        <Field name="cep">
          {({ field }: FieldProps) => (
            <TextField {...field} label="CEP" fullWidth margin="none" size="small" inputRef={cepRef} onBlur={handleCepBlur} />
          )}
        </Field>
      </Grid>

      <Grid size={{ xs: 12, sm: 9, md: 7 }}>
        <Field
          as={TextField}
          name="endereco"
          label="Logradouro"
          fullWidth
          margin="none"
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('endereco', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 3, md: 2 }}>
        <Field
          as={TextField}
          name="numeroLogradouro"
          label="Nº"
          fullWidth
          margin="none"
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('numeroLogradouro', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 9, md: 10 }}>
        <Field
          as={TextField}
          name="cidade"
          label="Cidade"
          fullWidth
          margin="none"
          size="small"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('cidade', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 3, md: 2 }}>
        <Autocomplete
          options={ESTADOS_BRASILEIROS}
          value={(values.estado as string | null) || null}
          onChange={(_e, newValue) => setFieldValue('estado', newValue || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              name="estado"
              label="UF"
              fullWidth
              margin="none"
              size="small"
              error={touched.estado && Boolean(errors.estado)}
              helperText={touched.estado && errors.estado}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default FilialForm;
