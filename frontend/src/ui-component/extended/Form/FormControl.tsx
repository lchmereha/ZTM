import { type ElementType } from 'react';

// material-ui
import Divider from '@mui/material/Divider';
import MUIFormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';

// ==============================|| CUSTOM FORM CONTROL ||============================== //

interface FormControlProps {
  captionLabel?: string;
  formState?: string;
  iconPrimary?: ElementType;
  iconSecondary?: ElementType;
  placeholder?: string;
  textPrimary?: string;
  textSecondary?: string;
}

const FormControl = ({
  captionLabel,
  formState,
  iconPrimary,
  iconSecondary,
  placeholder,
  textPrimary,
  textSecondary
}: FormControlProps) => {
  const primaryIcon = iconPrimary
    ? (() => {
        const Icon = iconPrimary;
        return <Icon fontSize="small" sx={{ color: 'grey.700' }} />;
      })()
    : null;

  const secondaryIcon = iconSecondary
    ? (() => {
        const Icon = iconSecondary;
        return <Icon fontSize="small" sx={{ color: 'grey.700' }} />;
      })()
    : null;

  const errorState = formState === 'error';

  return (
    <MUIFormControl fullWidth error={errorState}>
      <InputLabel>{captionLabel}</InputLabel>
      <OutlinedInput
        placeholder={placeholder}
        type="text"
        label={captionLabel}
        startAdornment={
          <>
            {primaryIcon && <InputAdornment position="start">{primaryIcon}</InputAdornment>}
            {textPrimary && (
              <>
                <InputAdornment position="start">{textPrimary}</InputAdornment>
                <Divider sx={{ height: 28, m: 0.5, mr: 1.5 }} orientation="vertical" />
              </>
            )}
          </>
        }
        endAdornment={
          <>
            {secondaryIcon && <InputAdornment position="end">{secondaryIcon}</InputAdornment>}
            {textSecondary && (
              <>
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <InputAdornment position="end">{textSecondary}</InputAdornment>
              </>
            )}
          </>
        }
      />
    </MUIFormControl>
  );
};

export default FormControl;
