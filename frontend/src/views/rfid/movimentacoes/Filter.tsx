import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { SituacaoMovimentacao } from 'models';
import type React from 'react';
import { useEffect, useState } from 'react';
import { tipoMovimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// ── Types ───────────────────────────────────────────────────

export interface MovimentacaoFilters {
  idTipoMovimentacao: number[];
  situacao: string[];
  descricao: string;
}

export const emptyFilters: MovimentacaoFilters = {
  idTipoMovimentacao: [],
  situacao: [],
  descricao: ''
};

interface MovimentacaoFilterProps {
  draft: MovimentacaoFilters;
  setDraft: React.Dispatch<React.SetStateAction<MovimentacaoFilters>>;
}

// ── Component ───────────────────────────────────────────────

const situacaoOptions = Object.values(SituacaoMovimentacao);

const MovimentacaoFilter = ({ draft, setDraft }: MovimentacaoFilterProps) => {
  const handleError = useErrorHandler();
  const [tiposMovimentacao, setTiposMovimentacao] = useState<{ id: number; descricao: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(tipoMovimentacaoEndpoint);
        setTiposMovimentacao(Array.isArray(data) ? data : []);
      } catch (err) {
        handleError(err);
      }
    };
    load();
  }, [handleError]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          multiple
          size="small"
          options={tiposMovimentacao}
          getOptionLabel={(option) => option.descricao || ''}
          value={tiposMovimentacao.filter((t) => draft.idTipoMovimentacao.includes(t.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idTipoMovimentacao: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Tipo de Movimentação" />}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          multiple
          size="small"
          options={situacaoOptions}
          value={draft.situacao}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, situacao: newValue }))}
          renderInput={(params) => <TextField {...params} label="Situação" />}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          size="small"
          name="descricao"
          label="Descrição"
          value={draft.descricao}
          onChange={(e) => setDraft((prev) => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
    </Grid>
  );
};

export default MovimentacaoFilter;
