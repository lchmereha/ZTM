// material-ui
import { styled } from '@mui/material/styles';

// project imports
import { drawerWidth } from 'store/constant';

// ==============================|| MAIN LAYOUT - STYLED ||============================== //

interface MainContentProps {
  open: boolean;
  borderRadius: number;
}

const MainContentStyled = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'borderRadius'
})<MainContentProps>(({ theme, open, borderRadius }) => ({
  backgroundColor: theme.vars?.palette.md3.surface,
  minWidth: '1%',
  width: '100%',
  minHeight: 'calc(100vh - 80px)',
  flexGrow: 1,
  marginTop: 80,
  marginRight: 0,
  borderRadius: `${borderRadius}px`,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  ...(!open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.shorter + 200
    }),
    [theme.breakpoints.up('md')]: {
      marginLeft: -(drawerWidth - 72),
      width: `calc(100% - ${drawerWidth}px)`,
      marginTop: 80
    }
  }),
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.shorter + 200
    }),
    marginLeft: 0,
    marginTop: 80,
    width: `calc(100% - ${drawerWidth}px)`,
    [theme.breakpoints.up('md')]: {
      marginTop: 80
    }
  }),
  [theme.breakpoints.down('md')]: {
    marginTop: 80,
    ...(!open && {
      width: `calc(100% - ${drawerWidth}px)`
    })
  }
}));

export default MainContentStyled;
