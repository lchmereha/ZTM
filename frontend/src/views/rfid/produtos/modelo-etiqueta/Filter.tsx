import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type React from 'react';

export interface EtiquetaFilters {
  nome: string;
  codigoZPL: string;
  ativo: string;
}

export const emptyFilters: EtiquetaFilters = { nome: '', codigoZPL: '', ativo: '' };

interface EtiquetaFilterProps {
  draft: EtiquetaFilters;
  setDraft: React.Dispatch<React.SetStateAction<EtiquetaFilters>>;
}

const EtiquetaFilter = ({ draft, setDraft }: EtiquetaFilterProps) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
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
        <FormControl fullWidth size="small">
          <InputLabel id="ativo-label">Situação</InputLabel>
          <Select
            labelId="ativo-label"
            name="ativo"
            value={draft.ativo}
            label="Situação"
            onChange={(e) => setDraft((prev) => ({ ...prev, ativo: e.target.value as string }))}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Ativo</MenuItem>
            <MenuItem value="false">Inativo</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          size="small"
          label="Código ZPL"
          multiline
          name="codigoZPL"
          rows={6}
          value={draft.codigoZPL}
          onChange={(e) => setDraft((prev) => ({ ...prev, codigoZPL: e.target.value }))}
        />
      </Grid>
    </Grid>
  );
};

export default EtiquetaFilter;
