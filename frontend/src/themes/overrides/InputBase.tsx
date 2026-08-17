import type { Theme } from '@mui/material/styles';

// ==============================|| OVERRIDES - INPUT BASE ||============================== //

export default function InputBase(theme: Theme) {
  return {
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: theme.vars?.palette.md3.onSurface,
          '&::placeholder': {
            color: theme.vars?.palette.text.secondary,
            fontSize: '0.875rem'
          },
          '&[type=number]::-webkit-inner-spin-button, &[type=number]::-webkit-outer-spin-button': {
            WebkitAppearance: 'none',
            margin: 0
          },
          '&[type=number]': {
            MozAppearance: 'textfield'
          }
        }
      }
    }
  };
}
