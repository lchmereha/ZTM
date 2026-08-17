import { useContext } from 'react';

import { DialogContext } from 'contexts/DialogContext';

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog deve ser utilizado dentro de um DialogProvider');
  }
  return context;
};
