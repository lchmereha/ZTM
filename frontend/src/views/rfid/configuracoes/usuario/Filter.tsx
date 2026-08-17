// packages
import { useEffect, useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// project imports
import { useErrorHandler } from 'hooks/useErrorHandler';
import { UsuarioRole, type Filial } from 'models';
import { filialEndpoint } from 'store/endpoints/rfidEndpoints';
import AutocompleteMulti from 'ui-component/extended/AutocompleteMulti';
import axios from 'utils/axios';

export interface UsuarioFilters {
  nome: string;
  usuario: string;
  email: string;
  regras: string[];
  idFiliais: number[];
}

export const emptyFilters: UsuarioFilters = { nome: '', usuario: '', email: '', regras: [], idFiliais: [] };

interface UsuarioFilterProps {
  draft: UsuarioFilters;
  setDraft: React.Dispatch<React.SetStateAction<UsuarioFilters>>;
}

const UsuarioFilter = ({ draft, setDraft }: UsuarioFilterProps) => {
  const handleError = useErrorHandler();
  const rolesUsuario = Object.values(UsuarioRole);
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
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
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
          label="Usuário (Login)"
          value={draft.usuario}
          onChange={(e) => setDraft((prev) => ({ ...prev, usuario: e.target.value.toUpperCase() }))}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          label="E-mail"
          type="email"
          value={draft.email}
          onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <AutocompleteMulti
          getOptionKey={(o) => o}
          getOptionLabel={(o) => o}
          label="Perfil"
          options={rolesUsuario}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, regras: newValue }))}
          value={draft.regras}
        />
      </Grid>
      <Grid size={12}>
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={filiais}
          getOptionLabel={(option) => option.nome || ''}
          value={filiais.filter((f) => draft.idFiliais.includes(f.id))}
          onChange={(_, newValue) => setDraft((prev) => ({ ...prev, idFiliais: newValue.map((v) => v.id) }))}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} label="Filiais Vinculadas" size="small" />}
        />
      </Grid>
    </Grid>
  );
};

export default UsuarioFilter;
