import { tenant } from 'config/tenants';
// material-ui
import Drawer from '@mui/material/Drawer';
import { styled, type CSSObject, type Theme } from '@mui/material/styles';

// project imports
import { drawerWidth } from 'store/constant';

function openedMixin(theme: Theme): CSSObject {
  return {
    width: drawerWidth,
    borderRight: 'none',
    zIndex: 1099,
    background: theme.vars?.palette.md3[tenant.chromeSurface],
    overflowX: 'hidden',
    boxShadow: 'none',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen + 200
    })
  };
}

function closedMixin(theme: Theme): CSSObject {
  return {
    borderRight: 'none',
    zIndex: 1099,
    background: theme.vars?.palette.md3[tenant.chromeSurface],
    overflowX: 'hidden',
    width: 72,
    [theme.breakpoints.down('md')]: {
      width: 0
    },
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen + 200
    })
  };
}

// ==============================|| DRAWER - MINI STYLED ||============================== //

interface MiniDrawerStyledProps {
  open?: boolean;
}

const MiniDrawerStyled = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })<MiniDrawerStyledProps>(({ theme, open }) => ({
  width: drawerWidth,
  borderRight: '0px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme)
  })
}));

export default MiniDrawerStyled;
