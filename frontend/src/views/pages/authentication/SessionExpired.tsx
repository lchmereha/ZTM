import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import Logo from 'ui-component/Logo';
import AuthCardWrapper from './AuthCardWrapper';
import AuthWrapper1 from './AuthWrapper1';

// ================================|| SESSION EXPIRED ||================================ //

const SessionExpired = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  // Ensure this page was reached via an automatic mechanism
  const [isAuthorized] = useState(() => sessionStorage.getItem('session_expired') === 'true');

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  const handleReturn = () => {
    sessionStorage.removeItem('session_expired');
    window.location.href = (import.meta.env.VITE_APP_BASE_NAME || '') + '/login';
  };

  return (
    <AuthWrapper1>
      <Grid container sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Grid sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
          <AuthCardWrapper>
            <Grid container spacing={2}>
              <Grid size={12} sx={{ px: 5 }}>
                <Link to="#" aria-label="theme-logo">
                  <Logo />
                </Link>
              </Grid>
              <Grid size={12}>
                <Grid container>
                  <Grid>
                    <Stack spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Typography align="center" color={theme.palette.secondary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
                        Sessão Expirada
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '16px', textAlign: 'center' }}>
                        Sua sessão no sistema expirou por inatividade ou acesso não autorizado.
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={12}>
                <Divider />
              </Grid>
              <Grid size={12}>
                <Grid container size={12}>
                  <Button
                    disableElevation
                    fullWidth
                    size="large"
                    type="button"
                    variant="contained"
                    color="secondary"
                    onClick={handleReturn}
                  >
                    Retornar ao Login
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </AuthCardWrapper>
        </Grid>
      </Grid>
    </AuthWrapper1>
  );
};

export default SessionExpired;
