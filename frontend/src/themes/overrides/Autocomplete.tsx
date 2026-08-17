import type { Theme } from '@mui/material/styles';

// ==============================|| OVERRIDES - AUTOCOMPLETE ||============================== //

export default function Autocomplete(theme: Theme) {
  return {
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.vars?.palette.md3.surfaceContainerHigh,
          color: theme.vars?.palette.md3.onSurface
        },
        tag: {
          backgroundColor: theme.vars?.palette.md3.secondaryContainer,
          color: theme.vars?.palette.md3.onSecondaryContainer,
          borderRadius: 4,
          '& .MuiChip-deleteIcon': {
            color: theme.vars?.palette.md3.onSecondaryContainer,
            opacity: 0.6,
            '&:hover': {
              color: theme.vars?.palette.md3.onSecondaryContainer,
              opacity: 1
            }
          }
        }
      }
    }
  };
}
