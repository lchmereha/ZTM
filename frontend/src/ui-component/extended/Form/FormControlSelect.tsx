import { type ChangeEvent, type ElementType, useState } from 'react';

// material-ui
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

// ==============================|| FORM CONTROL SELECT ||============================== //

interface CurrencyOption {
  value: string;
  label: string;
}

interface FormControlSelectProps {
  captionLabel?: string;
  currencies?: CurrencyOption[];
  formState?: string;
  iconPrimary?: ElementType;
  iconSecondary?: ElementType;
  selected?: string;
  textPrimary?: string;
  textSecondary?: string;
}

const FormControlSelect = ({
  captionLabel,
  currencies,
  formState,
  iconPrimary,
  iconSecondary,
  selected,
  textPrimary,
  textSecondary
}: FormControlSelectProps) => {
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
  const val = selected || '';

  const [currency, setCurrency] = useState(val);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) setCurrency(event.target.value);
  };

  return (
    <FormControl fullWidth error={errorState}>
      <TextField
        id="outlined-select-currency"
        select
        fullWidth
        label={captionLabel}
        value={currency}
        onChange={handleChange}
        slotProps={{
          input: {
            startAdornment: (
              <>
                {primaryIcon && <InputAdornment position="start">{primaryIcon}</InputAdornment>}
                {textPrimary && (
                  <>
                    <InputAdornment position="start">{textPrimary}</InputAdornment>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                  </>
                )}
              </>
            ),
            endAdornment: (
              <>
                {secondaryIcon && <InputAdornment position="end">{secondaryIcon}</InputAdornment>}
                {textSecondary && (
                  <>
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <InputAdornment position="end">{textSecondary}</InputAdornment>
                  </>
                )}
              </>
            )
          }
        }}
      >
        {currencies?.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </FormControl>
  );
};

export default FormControlSelect;
