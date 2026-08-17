import type { AlertOwnerState } from '@mui/material/Alert';
import type { Theme } from '@mui/material/styles';

// project imports
import { withAlpha } from 'utils/colorUtils';

// assets
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// ==============================|| OVERRIDES - ALERT ||============================== //

type PaletteColorKey = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

export default function Alert(theme: Theme) {
  const palette = theme.vars?.palette ?? theme.palette;

  const getPaletteColor = (severity: string | undefined) => {
    const key = (severity || 'info') as PaletteColorKey;
    return palette[key];
  };

  const getCommonStyles = (ownerState: AlertOwnerState) => {
    const isWarningOrSuccess = ownerState.severity === 'warning' || ownerState.severity === 'success';
    return { isWarningOrSuccess };
  };

  const standardVariant = ({ ownerState }: { ownerState: AlertOwnerState }) => {
    const paletteColor = getPaletteColor(ownerState.severity);
    const { isWarningOrSuccess } = getCommonStyles(ownerState);

    return {
      color: isWarningOrSuccess ? paletteColor.dark : paletteColor.main,
      backgroundColor: withAlpha(paletteColor.main, 0.075),
      '& .MuiAlert-icon': { color: isWarningOrSuccess ? paletteColor.dark : paletteColor.main }
    };
  };

  const outlinedVariant = ({ ownerState }: { ownerState: AlertOwnerState }) => {
    const paletteColor = getPaletteColor(ownerState.severity);
    const { isWarningOrSuccess } = getCommonStyles(ownerState);

    return {
      color: isWarningOrSuccess ? paletteColor.dark : paletteColor.main,
      borderColor: paletteColor.dark,
      '& .MuiAlert-icon': { color: isWarningOrSuccess ? paletteColor.dark : paletteColor.main }
    };
  };

  const filledVariant = ({ ownerState }: { ownerState: AlertOwnerState }) => {
    const paletteColor = getPaletteColor(ownerState.severity);
    const { isWarningOrSuccess } = getCommonStyles(ownerState);

    return {
      color: isWarningOrSuccess ? palette.common.black : palette.common.white,
      backgroundColor: isWarningOrSuccess ? paletteColor.dark : paletteColor.main,
      '& .MuiAlert-icon': {
        color: isWarningOrSuccess ? palette.common.black : palette.common.white
      }
    };
  };

  return {
    MuiAlert: {
      defaultProps: {
        iconMapping: {
          primary: <InfoOutlinedIcon sx={{ fontSize: 'inherit' }} />
        }
      },
      styleOverrides: {
        root: {
          alignItems: 'center',
          variants: [
            { props: { variant: 'standard' }, style: standardVariant },
            { props: { variant: 'outlined' }, style: outlinedVariant },
            { props: { variant: 'filled' }, style: filledVariant }
          ]
        },
        outlined: { border: '1px dashed' }
      }
    }
  };
}
