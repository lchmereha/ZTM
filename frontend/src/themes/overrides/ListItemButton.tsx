import type { Theme } from '@mui/material/styles';
import { tenant } from 'config/tenants';

// ==============================|| OVERRIDES - LIST ITEM BUTTON ||============================== //

const ACCENT = tenant.accentRole;
const ACCENT_ON = tenant.accentRole === 'primary' ? 'onPrimary' : 'onSecondary';

export default function ListItemButton(theme: Theme) {
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.vars?.palette.text.primary,
          paddingTop: '10px',
          paddingBottom: '10px',

          '&.Mui-selected': {
            color: theme.vars?.palette.md3[ACCENT_ON],
            backgroundColor: theme.vars?.palette.md3[ACCENT],
            '&:hover': {
              backgroundColor: theme.vars?.palette.md3[ACCENT]
            },
            '& .MuiListItemIcon-root': {
              color: theme.vars?.palette.md3[ACCENT_ON]
            }
          },

          '&:hover': {
            backgroundColor: theme.vars?.palette.md3[ACCENT],
            color: theme.vars?.palette.md3[ACCENT_ON],
            '& .MuiListItemIcon-root': {
              color: theme.vars?.palette.md3[ACCENT_ON]
            }
          }
        }
      }
    }
  };
}
