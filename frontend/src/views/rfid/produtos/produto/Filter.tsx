// packages
import type React from 'react';
import { useEffect, useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useErrorHandler } from 'hooks/useErrorHandler';
import { categoriaEndpoint, modeloEtiquetaEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface ProdutoFilters {
  codigo: string;
  nome: string;
  unidadeMedida: string;
  idCategoria: number[];
  idModeloEtiqueta: number[];
}

export const emptyFilters: ProdutoFilters = {
  codigo: '',
  nome: '',
  unidadeMedida: '',
  idCategoria: [],
  idModeloEtiqueta: []
};

interface ProdutoFilterProps {
  draft: ProdutoFilters;
  setDraft: React.Dispatch<React.SetStateAction<ProdutoFilters>>;
}

const ProdutoFilter = ({ draft, setDraft }: ProdutoFilterProps) => {
  const handleError = useErrorHandler();
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [modelos, setModelos] = useState<{ id: number; nome: string }[]>([]);

  useEffect(() => {
    const loadCombos = async () => {
      try {
        const [catRes, modRes] = await Promise.all([axios.get(categoriaEndpoint), axios.get(modeloEtiquetaEndpoint)]);
        setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
        setModelos(Array.isArray(modRes.data) ? modRes.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadCombos();
  }, [handleError]);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <TextField
          fullWidth
          size="small"
          name="nome"
          label="Nome"
          value={draft.nome}
          onChange={(e) => setDraft((prev) => ({ ...prev, nome: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={8}>
        <TextField
          fullWidth
          size="small"
          name="codigo"
          label="Código"
          value={draft.codigo}
          onChange={(e) => setDraft((prev) => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={4}>
        <TextField
          fullWidth
          size="small"
          name="unidadeMedida"
          label="Unidade de Medida"
          value={draft.unidadeMedida}
          onChange={(e) => setDraft((prev) => ({ ...prev, unidadeMedida: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={12}>
        <Autocomplete
          multiple
          size="small"
          options={categorias}
          getOptionLabel={(option) => option.nome || ''}
          value={categorias.filter((c) => draft.idCategoria.includes(c.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idCategoria: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Categorias" />}
        />
      </Grid>

      <Grid size={12}>
        <Autocomplete
          multiple
          size="small"
          options={modelos}
          getOptionLabel={(option) => option.nome || ''}
          value={modelos.filter((m) => draft.idModeloEtiqueta.includes(m.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idModeloEtiqueta: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Modelos de Etiqueta" />}
        />
      </Grid>
    </Grid>
  );
};

export default ProdutoFilter;
