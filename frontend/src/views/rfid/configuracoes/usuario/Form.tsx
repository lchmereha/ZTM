import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Field, useFormikContext } from 'formik';
import { useErrorHandler } from 'hooks/useErrorHandler';
import type { CreateUsuarioDto, PermissoesUsuario } from 'interfaces';
import { type Filial, type OpcaoMenu, UsuarioRole } from 'models';
import { useEffect, useState } from 'react';
import { filialEndpoint, permissaoEndpoint } from 'store/endpoints/rfidEndpoints';
import AutocompleteMulti from 'ui-component/extended/AutocompleteMulti';
import axios from 'utils/axios';

export interface IUsuarioForm extends CreateUsuarioDto {
  id: number;
  confirmarSenha?: string;
}

const rolesUsuario = Object.values(UsuarioRole);

type PermKey = keyof PermissoesUsuario;

const permLabels: { key: PermKey; label: string }[] = [
  { key: 'visualizar', label: 'Visualizar' },
  { key: 'incluir', label: 'Incluir' },
  { key: 'alterar', label: 'Alterar' },
  { key: 'excluir', label: 'Excluir' }
];

// ── Campo de senha com toggle de visibilidade ───────────────────
const PasswordField = ({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) => {
  const { getFieldProps, getFieldMeta } = useFormikContext<IUsuarioForm>();
  const [show, setShow] = useState(false);
  const field = getFieldProps(name);
  const meta = getFieldMeta(name);

  return (
    <TextField
      {...field}
      label={label}
      type={show ? 'text' : 'password'}
      fullWidth
      margin="none"
      size="small"
      disabled={disabled}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShow((prev) => !prev)} edge="end" tabIndex={-1}>
                {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
};

const UsuarioForm = () => {
  const handleError = useErrorHandler();
  const { values, setFieldValue, errors, touched } = useFormikContext<IUsuarioForm>();
  const [filiais, setFiliais] = useState<Pick<Filial, 'id' | 'nome'>[]>([]);
  const [opcoesMenu, setOpcoesMenu] = useState<OpcaoMenu[]>([]);

  const isEditMode = values.id > 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [filialRes, menuRes] = await Promise.all([axios.get(filialEndpoint), axios.get(`${permissaoEndpoint}/opcoes-menu`)]);
        setFiliais(Array.isArray(filialRes.data) ? filialRes.data : []);
        setOpcoesMenu(Array.isArray(menuRes.data) ? menuRes.data : []);
      } catch (err) {
        handleError(err);
      }
    };
    loadData();
  }, [handleError]);

  const permissoes = values.permissoes ?? { visualizar: [], incluir: [], alterar: [], excluir: [] };

  const handlePermChange = (key: PermKey, newValue: OpcaoMenu[]) => {
    setFieldValue('permissoes', { ...permissoes, [key]: newValue.map((v) => v.id) });
  };

  const adminOnlyKeys = ['CAD_USUARIO', 'CAD_EMPRESA', 'CAD_API_KEY'];
  const adminOnlyIds = opcoesMenu.filter((o) => adminOnlyKeys.includes(o.chave)).map((o) => o.id);
  const displayedOpcoesMenu = values.regra === 'ADMIN' ? opcoesMenu : opcoesMenu.filter((o) => !adminOnlyKeys.includes(o.chave));

  return (
    <Grid container spacing={2} sx={{ marginTop: 0.5 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="nome"
          label="Nome"
          fullWidth
          margin="none"
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="usuario"
          label="Usuário"
          fullWidth
          margin="none"
          size="small"
          error={touched.usuario && Boolean(errors.usuario)}
          helperText={touched.usuario && errors.usuario}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('usuario', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <PasswordField name="senha" label={isEditMode ? 'Nova Senha (deixe vazio para manter)' : 'Senha'} />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <PasswordField
          name="confirmarSenha"
          label={isEditMode ? 'Confirmar Nova Senha' : 'Confirmar Senha'}
          disabled={isEditMode && !values.senha}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Field
          as={TextField}
          name="email"
          label="E-mail"
          type="email"
          fullWidth
          margin="none"
          size="small"
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email}
        />
      </Grid>

      <Grid container size={{ xs: 12, md: 6 }}>
        <Grid size="grow">
          <Autocomplete
            options={rolesUsuario}
            value={values.regra || null}
            onChange={(_, newValue) => {
              setFieldValue('regra', newValue || '');
              if (newValue !== 'ADMIN') {
                const newPermissoes = { ...permissoes };
                let changed = false;
                (Object.keys(newPermissoes) as PermKey[]).forEach((action) => {
                  const filtered = newPermissoes[action].filter((id) => !adminOnlyIds.includes(id));
                  if (filtered.length !== newPermissoes[action].length) {
                    newPermissoes[action] = filtered;
                    changed = true;
                  }
                });
                if (changed) {
                  setFieldValue('permissoes', newPermissoes);
                }
              }
            }}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Perfil"
                margin="none"
                size="small"
                error={touched.regra && Boolean(errors.regra)}
                helperText={touched.regra && errors.regra}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 'auto' }} sx={{ alignItems: 'center' }}>
          <FormControlLabel
            control={<Checkbox checked={values.ativo ?? true} onChange={(e) => setFieldValue('ativo', e.target.checked)} size="small" />}
            label="Ativo"
          />
        </Grid>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          disableCloseOnSelect
          multiple
          size="small"
          options={filiais}
          getOptionLabel={(option) => option.nome || ''}
          value={filiais.filter((f) => values.idFiliais?.includes(f.id))}
          onChange={(_, newValue) =>
            setFieldValue(
              'idFiliais',
              newValue.map((v) => v.id)
            )
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} label="Filiais Vinculadas" margin="none" size="small" />}
        />
      </Grid>

      {/* Permissões */}
      <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Permissões
        </Typography>
      </Grid>

      {permLabels.map(({ key, label }) => (
        <Grid key={key} size={{ xs: 12, md: 6 }}>
          <AutocompleteMulti
            options={displayedOpcoesMenu}
            value={displayedOpcoesMenu.filter((o) => permissoes[key].includes(o.id))}
            onChange={(_, newValue) => handlePermChange(key, newValue)}
            label={label}
            getOptionLabel={(o) => o.nome || ''}
            getOptionKey={(o) => o.id}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default UsuarioForm;
