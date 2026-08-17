import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// material-ui
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import Stack from '@mui/material/Stack';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { tenant } from 'config/tenants';
import useBuildVersionCheck from 'hooks/useBuildVersionCheck';
import useConfig from 'hooks/useConfig';
import Loader from 'ui-component/Loader';
import Breadcrumbs from 'ui-component/extended/Breadcrumbs';
import Header from './Header';
import MainContentStyled from './MainContentStyled';
import Sidebar from './Sidebar';

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const {
    state: { borderRadius, miniDrawer }
  } = useConfig();
  const { menuMaster, menuMasterLoading } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;

  // Detecta deploy novo a cada troca de rota e recarrega a página.
  useBuildVersionCheck();

  useEffect(() => {
    handlerDrawerOpen(!miniDrawer);
  }, [miniDrawer]);

  useEffect(() => {
    if (downMD) {
      handlerDrawerOpen(false);
    }
  }, [downMD]);

  // horizontal menu-list bar : drawer

  if (menuMasterLoading) return <Loader />;

  return (
    <Stack direction="row">
      {/* header */}
      <AppBar enableColorOnDark position="fixed" color="inherit" elevation={0} sx={{ bgcolor: `md3.${tenant.chromeSurface}` }}>
        <Toolbar sx={{ py: 2 }}>
          <Header />
        </Toolbar>
      </AppBar>

      {/* menu / drawer */}
      <Sidebar />

      {/* main content */}
      <MainContentStyled {...{ borderRadius, open: drawerOpen }}>
        <Stack sx={{ p: 2, minHeight: 'calc(100vh - 128px)' }}>
          {/* breadcrumb */}
          <Breadcrumbs />
          <Outlet />
        </Stack>
      </MainContentStyled>
    </Stack>
  );
}
