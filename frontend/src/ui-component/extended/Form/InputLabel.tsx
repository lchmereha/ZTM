import { type ReactNode } from 'react';

// material-ui
import MuiInputLabel, { type InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';

// ==============================|| CUSTOM INPUT LABEL ||============================== //

interface BInputLabelProps extends MuiInputLabelProps {
  horizontal?: boolean;
}

const BInputLabel = styled(MuiInputLabel, {
  shouldForwardProp: (prop) => prop !== 'horizontal'
})<BInputLabelProps>(({ theme, horizontal }) => ({
  color: theme.vars?.palette.text.primary,
  fontWeight: 500,
  marginBottom: horizontal ? 0 : 8
}));

interface InputLabelProps extends Omit<MuiInputLabelProps, 'children'> {
  children?: ReactNode;
  horizontal?: boolean;
}

const InputLabel = ({ children, horizontal = false, ...others }: InputLabelProps) => {
  return (
    <BInputLabel horizontal={horizontal} {...others}>
      {children}
    </BInputLabel>
  );
};

export default InputLabel;
