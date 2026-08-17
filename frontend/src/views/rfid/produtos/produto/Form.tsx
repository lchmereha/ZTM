// packages
import { Field, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useAuth } from 'contexts/AuthContext';
import { useErrorHandler } from 'hooks/useErrorHandler';
import type { CreateProdutoDto } from 'interfaces';
import { categoriaEndpoint, modeloEtiquetaEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface IProdutoForm extends Omit<CreateProdutoDto, 'idEmpresa'> {
  id: number;
}

const ProdutoForm = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<IProdutoForm>();
  const { activeFilial } = useAuth();
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [modelos, setModelos] = useState<{ id: number; nome: string }[]>([]);
  const handleError = useErrorHandler();

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = activeFilial ? { idEmpresa: activeFilial.idEmpresa } : {};
        const [catRes, modRes] = await Promise.all([
          axios.get(categoriaEndpoint, { params }),
          axios.get(modeloEtiquetaEndpoint, { params })
        ]);
        setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
        setModelos(Array.isArray(modRes.data) ? modRes.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [handleError, activeFilial]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="codigo"
          label="Código do Produto (SKU)"
          fullWidth
          margin="none"
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
          label="Nome do Produto"
          fullWidth
          margin="none"
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="unidadeMedida"
          label="Unidade de Medida"
          placeholder="UN, KG, CX"
          fullWidth
          margin="none"
          size="small"
          error={touched.unidadeMedida && Boolean(errors.unidadeMedida)}
          helperText={touched.unidadeMedida && errors.unidadeMedida}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('unidadeMedida', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          autoHighlight
          fullWidth
          getOptionLabel={(option) => option.nome || ''}
          options={categorias}
          value={categorias.find((c) => c.id === values.idCategoria) || null}
          onChange={(_e, newValue) => setFieldValue('idCategoria', newValue ? newValue.id : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Categoria"
              margin="none"
              size="small"
              error={touched.idCategoria && Boolean(errors.idCategoria)}
              helperText={touched.idCategoria && errors.idCategoria}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          autoHighlight
          fullWidth
          getOptionLabel={(option) => option.nome || ''}
          options={modelos}
          value={modelos.find((m) => m.id === values.idModeloEtiqueta) || null}
          onChange={(_e, newValue) => setFieldValue('idModeloEtiqueta', newValue ? newValue.id : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Etiqueta"
              margin="none"
              size="small"
              error={touched.idModeloEtiqueta && Boolean(errors.idModeloEtiqueta)}
              helperText={touched.idModeloEtiqueta && errors.idModeloEtiqueta}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default ProdutoForm;
