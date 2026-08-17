import { Link as RouterLink } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

// project imports
import { DASHBOARD_PATH } from 'config';
import Logo from 'ui-component/Logo';

// ==============================|| MAIN LOGO ||============================== //

export default function LogoSection() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: 80, my: -2, py: 1 }}>
      <Link
        component={RouterLink}
        to={DASHBOARD_PATH}
        aria-label="theme-logo"
        sx={{ display: 'flex', alignItems: 'center', height: '100%' }}
      >
        <Logo />
      </Link>
    </Box>
  );
}
