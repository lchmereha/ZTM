import { cloneElement } from 'react';

// material-ui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import useScrollTrigger from '@mui/material/useScrollTrigger';

// project imports
import useConfig from 'hooks/useConfig';
import MenuList from './MenuList';

interface ElevationScrollProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cloneElement requires ReactElement<any>
  children: React.ReactElement<any>;
  window?: Window | Node;
}

function ElevationScroll({ children, window }: ElevationScrollProps) {
  const theme = useTheme();

  /**
   * Note that you normally won't need to set the window ref as useScrollTrigger will default to window.
   * This is only being set here because the demo is in an iframe.
   */
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window
  });

  const elevation = trigger ? 4 : 0;

  return cloneElement(children, {
    elevation,
    ...(elevation === 4 && {
      sx: { boxShadow: theme.vars?.customShadows.z1 }
    })
  });
}

// ==============================|| HORIZONTAL MENU LIST ||============================== //

export default function HorizontalBar() {
  const {
    state: { container }
  } = useConfig();

  return (
    <ElevationScroll>
      <AppBar
        sx={(_theme) => ({
          top: 71,
          bgcolor: 'background.paper',
          width: '100%',
          height: 62,
          justifyContent: 'center',
          borderTop: '1px solid',
          borderColor: 'grey.300',
          zIndex: 1098
        })}
      >
        <Container maxWidth={container ? 'lg' : false}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MenuList />
          </Box>
        </Container>
      </AppBar>
    </ElevationScroll>
  );
}
