// icons
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { tenant } from 'config/tenants';

const ACCENT = tenant.accentRole;
import LogoSection from '../LogoSection';
import FilialSelector from './FilialSelector';
import OptionsSection from './OptionsSection';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;

  return (
    <>
      {/* logo & toggler button */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', alignSelf: 'stretch', width: downMD ? 'auto' : 260 }}>
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1, alignSelf: 'stretch' }}>
          <LogoSection />
        </Box>
        <IconButton
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            overflow: 'hidden',
            transition: 'all .2s ease-in-out',
            color: theme.vars?.palette[ACCENT].contrastText,
            background: theme.vars?.palette[ACCENT].light,
            '&:hover': {
              color: theme.vars?.palette[ACCENT].light,
              background: theme.vars?.palette[ACCENT].dark
            }
          }}
        >
          {drawerOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Stack>

      <Box sx={{ flexGrow: 1 }} />

      <FilialSelector />

      <Box sx={{ flexGrow: 1 }} />

      {/* profile */}
      <OptionsSection />
    </>
  );
}
