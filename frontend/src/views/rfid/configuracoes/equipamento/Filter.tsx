// packages
import type React from 'react';
import { useEffect, useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useErrorHandler } from 'hooks/useErrorHandler';
import { TipoEquipamento, type Filial } from 'models';
import { filialEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface EquipamentoFilters {
  nome: string;
  tipo: string[];
  idFilial: number[];
  ipConexao: string;
  portaConexao: string;
  ativo: '' | 'true' | 'false';
  exibeConexaoSocket: '' | 'true' | 'false';
}

export const emptyFilters: EquipamentoFilters = {
  nome: '',
  tipo: [],
  idFilial: [],
  ipConexao: '',
  portaConexao: '',
  ativo: '',
  exibeConexaoSocket: ''
};

interface EquipamentoFilterProps {
  draft: EquipamentoFilters;
  setDraft: React.Dispatch<React.SetStateAction<EquipamentoFilters>>;
}

const booleanOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' }
];

const EquipamentoFilter = ({ draft, setDraft }: EquipamentoFilterProps) => {
  const handleError = useErrorHandler();
  const tiposEquipamento = Object.values(TipoEquipamento);
  const [filiais, setFiliais] = useState<Pick<Filial, 'id' | 'nome'>[]>([]);

  useEffect(() => {
    const loadFiliais = async () => {
      try {
        const { data } = await axios.get(filialEndpoint);
        setFiliais(Array.isArray(data) ? data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadFiliais();
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

      <Grid size={{ xs: 12, md: 8 }}>
        <Autocomplete
          multiple
          size="small"
          options={filiais}
          getOptionLabel={(option) => option.nome || ''}
          value={filiais.filter((f) => draft.idFilial.includes(f.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idFilial: newValue.map((v) => v.id) }))}
          renderInput={(params) => <TextField {...params} label="Filial" />}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          multiple
          size="small"
          options={tiposEquipamento}
          value={draft.tipo}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, tipo: newValue }))}
          renderInput={(params) => <TextField {...params} label="Tipo" />}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          name="ipConexao"
          label="IP"
          value={draft.ipConexao}
          onChange={(e) => setDraft((prev) => ({ ...prev, ipConexao: e.target.value }))}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          size="small"
          name="portaConexao"
          label="Porta"
          type="number"
          value={draft.portaConexao}
          onChange={(e) => setDraft((prev) => ({ ...prev, portaConexao: e.target.value }))}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          size="small"
          options={booleanOptions}
          getOptionLabel={(opt) => opt.label}
          value={booleanOptions.find((o) => o.value === draft.ativo) || booleanOptions[0]}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, ativo: (newValue?.value || '') as EquipamentoFilters['ativo'] }))}
          disableClearable
          renderInput={(params) => <TextField {...params} label="Ativo" />}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          size="small"
          options={booleanOptions}
          getOptionLabel={(opt) => opt.label}
          value={booleanOptions.find((o) => o.value === draft.exibeConexaoSocket) || booleanOptions[0]}
          onChange={(_, newValue) =>
            setDraft((prev) => ({ ...prev, exibeConexaoSocket: (newValue?.value || '') as EquipamentoFilters['exibeConexaoSocket'] }))
          }
          disableClearable
          renderInput={(params) => <TextField {...params} label="Exibe Conexão Socket" />}
        />
      </Grid>
    </Grid>
  );
};

export default EquipamentoFilter;
