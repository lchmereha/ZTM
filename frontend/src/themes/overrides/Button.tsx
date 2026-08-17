import type { Theme } from '@mui/material/styles';

// ==============================|| OVERRIDES - BUTTON ||============================== //

export default function Button(theme: Theme) {
  return {
    MuiSlider: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: theme.vars?.palette.grey[300]
          }
        },
        mark: {
          backgroundColor: theme.vars?.palette.background.paper,
          width: '4px'
        },
        valueLabel: {
          color: theme.vars?.palette.primary.light
        }
      }
    }
  };
}
