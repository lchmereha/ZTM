import type { Theme } from '@mui/material/styles';

// ==============================|| OVERRIDES - CARD ||============================== //

export default function Card(theme: Theme) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: theme.vars?.palette.md3.surfaceBright
        }
      }
    }
  };
}
