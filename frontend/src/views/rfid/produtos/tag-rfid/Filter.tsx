import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useErrorHandler } from 'hooks/useErrorHandler';
import type React from 'react';
import { useEffect, useState } from 'react';
import { produtoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface TagFilters {
  codigoRfid: string;
  codigoUnico: string;
  lote: string;
  idProduto: number[];
}

export const emptyFilters: TagFilters = {
  codigoRfid: '',
  codigoUnico: '',
  lote: '',
  idProduto: []
};

interface TagFilterProps {
  draft: TagFilters;
  setDraft: React.Dispatch<React.SetStateAction<TagFilters>>;
}

const TagRfidFilter = ({ draft, setDraft }: TagFilterProps) => {
  const handleError = useErrorHandler();
  const [produtos, setProdutos] = useState<{ id: number; nome: string }[]>([]);

  useEffect(() => {
    const loadCombos = async () => {
      try {
        const prodRes = await axios.get(produtoEndpoint);
        setProdutos(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadCombos();
  }, [handleError]);

  return (
    <Grid container columnSpacing={2} rowSpacing={1}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          name="codigoRfid"
          label="Código RFID"
          value={draft.codigoRfid}
          onChange={(e) => setDraft((prev) => ({ ...prev, codigoRfid: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          name="codigoUnico"
          label="Código Único"
          value={draft.codigoUnico}
          onChange={(e) => setDraft((prev) => ({ ...prev, codigoUnico: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          name="lote"
          label="Lote"
          value={draft.lote}
          onChange={(e) => setDraft((prev) => ({ ...prev, lote: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          multiple
          size="small"
          options={produtos}
          getOptionLabel={(option) => option.nome || ''}
          value={produtos.filter((p) => draft.idProduto.includes(p.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idProduto: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Produtos" />}
        />
      </Grid>
    </Grid>
  );
};

export default TagRfidFilter;
