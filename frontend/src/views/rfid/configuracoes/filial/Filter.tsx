// packages
import type React from 'react';
import { useEffect, useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useErrorHandler } from 'hooks/useErrorHandler';
import { ESTADOS_BRASILEIROS } from 'models';
import { empresaEndpoint, modeloEtiquetaEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface FilialFilters {
  nome: string;
  documentoIdentificacao: string;
  cidade: string;
  estado: string;
  telefone: string;
  idEmpresa: number[];
  idEtiquetaPadrao: number[];
}

export const emptyFilters: FilialFilters = {
  nome: '',
  documentoIdentificacao: '',
  cidade: '',
  estado: '',
  telefone: '',
  idEmpresa: [],
  idEtiquetaPadrao: []
};

interface FilialFilterProps {
  draft: FilialFilters;
  setDraft: React.Dispatch<React.SetStateAction<FilialFilters>>;
}

const FilialFilter = ({ draft, setDraft }: FilialFilterProps) => {
  const handleError = useErrorHandler();
  const [empresas, setEmpresas] = useState<{ id: number; nome: string }[]>([]);
  const [etiquetas, setEtiquetas] = useState<{ id: number; nome: string }[]>([]);

  useEffect(() => {
    const loadCombos = async () => {
      try {
        const [empresasRes, etiquetasRes] = await Promise.all([axios.get(empresaEndpoint), axios.get(modeloEtiquetaEndpoint)]);
        setEmpresas(Array.isArray(empresasRes.data) ? empresasRes.data : []);
        setEtiquetas(Array.isArray(etiquetasRes.data) ? etiquetasRes.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadCombos();
  }, [handleError]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
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
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          name="documentoIdentificacao"
          label="Documento (CNPJ/IE)"
          value={draft.documentoIdentificacao}
          onChange={(e) => setDraft((prev) => ({ ...prev, documentoIdentificacao: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          name="telefone"
          label="Telefone"
          value={draft.telefone}
          onChange={(e) => setDraft((prev) => ({ ...prev, telefone: e.target.value }))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          name="cidade"
          label="Cidade"
          value={draft.cidade}
          onChange={(e) => setDraft((prev) => ({ ...prev, cidade: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          options={ESTADOS_BRASILEIROS}
          value={(draft.estado as string | null) || null}
          onChange={(_e, newValue) => setDraft((prev) => ({ ...prev, estado: newValue || '' }))}
          renderInput={(params) => <TextField {...params} name="estado" label="Estado (UF)" fullWidth size="small" />}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          size="small"
          options={empresas}
          getOptionLabel={(option) => option.nome || ''}
          value={empresas.filter((e) => draft.idEmpresa.includes(e.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idEmpresa: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Empresa Vinculada" />}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          size="small"
          options={etiquetas}
          getOptionLabel={(option) => option.nome || ''}
          value={etiquetas.filter((e) => draft.idEtiquetaPadrao.includes(e.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idEtiquetaPadrao: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Etiquetas Padrão" />}
        />
      </Grid>
    </Grid>
  );
};

export default FilialFilter;
