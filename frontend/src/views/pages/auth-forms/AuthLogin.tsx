import { useFormik } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosServices from 'utils/axios';
import * as Yup from 'yup';

// icons
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import { useAuth } from 'contexts/AuthContext';
import type { LoginDto, TipoLogin } from 'interfaces';
import AnimateButton from 'ui-component/extended/AnimateButton';
import CustomFormControl from 'ui-component/extended/Form/CustomFormControl';

// ===============================|| JWT - LOGIN ||=============================== //

export default function AuthLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tipoLogin, setTipoLogin] = useState<TipoLogin>('usuario');

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const isEmailMode = tipoLogin === 'email';

  const formik = useFormik({
    initialValues: {
      usuario: '',
      senha: '',
      submit: null
    },
    validationSchema: Yup.object().shape({
      usuario: isEmailMode
        ? Yup.string().email('E-mail inválido').required('E-mail é obrigatório')
        : Yup.string().max(255).required('Nome de usuário é obrigatório'),
      senha: Yup.string().max(255).required('A senha é obrigatória')
    }),
    onSubmit: async (values, { setErrors, setStatus, setSubmitting }) => {
      try {
        const payload: LoginDto = {
          usuario: values.usuario,
          senha: values.senha,
          tipoLogin,
          rememberMe: checked
        };
        const response = await axiosServices.post('/auth/login', payload);

        // Token is set as httpOnly cookie by the server — only user data comes in the response body
        const { user } = response.data;

        await login(user, checked);

        setStatus({ success: true });
        setSubmitting(false);
        navigate('/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus({ success: false });
        setErrors({ submit: message });
        setSubmitting(false);
      }
    }
  });

  const handleTipoLoginChange = (newType: TipoLogin) => {
    setTipoLogin(newType);
    formik.setFieldValue('usuario', '');
    formik.setFieldTouched('usuario', false);
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = isEmailMode ? e.target.value : e.target.value.toUpperCase();
    formik.setFieldValue('usuario', value);
  };

  return (
    <form noValidate onSubmit={formik.handleSubmit}>
      <RadioGroup row value={tipoLogin} onChange={(e) => handleTipoLoginChange(e.target.value as TipoLogin)} sx={{ gap: 0 }}>
        <FormControlLabel
          control={<Radio size="small" />}
          label={
            <Stack direction="row" spacing={1}>
              <PersonIcon fontSize="small" />
              <Typography variant="caption">Usuário</Typography>
            </Stack>
          }
          slotProps={{ typography: { variant: 'body2' } }}
          value="usuario"
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem' }, maxHeight: 24 }}
        />
        <FormControlLabel
          control={<Radio size="small" />}
          label={
            <Stack direction="row" spacing={1}>
              <AlternateEmailIcon fontSize="small" />
              <Typography variant="caption">E-mail</Typography>
            </Stack>
          }
          slotProps={{ typography: { variant: 'body2' } }}
          value="email"
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem' }, maxHeight: 24 }}
        />
      </RadioGroup>

      <CustomFormControl fullWidth error={Boolean(formik.touched.usuario && formik.errors.usuario)}>
        <InputLabel htmlFor="outlined-adornment-usuario-login">{isEmailMode ? 'E-mail' : 'Nome de Usuário'}</InputLabel>
        <OutlinedInput
          id="outlined-adornment-usuario-login"
          type={isEmailMode ? 'email' : 'text'}
          value={formik.values.usuario}
          name="usuario"
          onBlur={formik.handleBlur}
          onChange={handleUsuarioChange}
          label={isEmailMode ? 'E-mail' : 'Nome de Usuário'}
          inputProps={{
            style: isEmailMode ? {} : { textTransform: 'uppercase' },
            autoCapitalize: isEmailMode ? 'off' : 'characters'
          }}
        />
        {formik.touched.usuario && formik.errors.usuario && (
          <FormHelperText error id="standard-weight-helper-text-usuario-login">
            {formik.errors.usuario}
          </FormHelperText>
        )}
      </CustomFormControl>

      <CustomFormControl fullWidth error={Boolean(formik.touched.senha && formik.errors.senha)}>
        <InputLabel htmlFor="outlined-adornment-senha-login">Senha</InputLabel>
        <OutlinedInput
          id="outlined-adornment-senha-login"
          type={showPassword ? 'text' : 'password'}
          value={formik.values.senha}
          name="senha"
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="large"
              >
                {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </InputAdornment>
          }
          label="Senha"
        />
        {formik.touched.senha && formik.errors.senha && (
          <FormHelperText error id="standard-weight-helper-text-senha-login">
            {formik.errors.senha}
          </FormHelperText>
        )}
      </CustomFormControl>

      {formik.errors.submit && (
        <Box sx={{ mt: 3 }}>
          <FormHelperText error>{String(formik.errors.submit)}</FormHelperText>
        </Box>
      )}

      <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Grid>
          <FormControlLabel
            control={<Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} name="checked" color="primary" />}
            label="Mantenha-me conectado"
          />
        </Grid>
      </Grid>

      <Box>
        <AnimateButton>
          <Button disableElevation color="secondary" fullWidth loading={formik.isSubmitting} size="large" type="submit" variant="contained">
            Entrar
          </Button>
        </AnimateButton>
      </Box>
    </form>
  );
}
