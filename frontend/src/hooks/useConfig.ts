import { ConfigContext } from 'contexts/ConfigContext';
import { use } from 'react';

// ==============================|| CONFIG - HOOKS ||============================== //

export default function useConfig() {
  const context = use(ConfigContext);

  if (!context) throw new Error('useConfig must be use inside ConfigProvider');

  return context;
}
