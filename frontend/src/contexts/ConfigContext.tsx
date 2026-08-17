import { createContext, useMemo } from 'react';

// project imports
import config from 'config';
import { useLocalStorage } from 'hooks/useLocalStorage';

// ==============================|| CONFIG CONTEXT ||============================== //

export interface ConfigState {
  fontFamily: string;
  borderRadius: number;
  miniDrawer: boolean;
  container: boolean;
}

export interface ConfigContextType {
  state: ConfigState;
  setState: (value: ConfigState) => void;
  setField: (fieldName: string, value: unknown) => void;
  resetState: () => void;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// ==============================|| CONFIG PROVIDER ||============================== //

interface ConfigProviderProps {
  children: React.ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const { state, setState, setField, resetState } = useLocalStorage('ztm-config', config);

  const memoizedValue = useMemo<ConfigContextType>(
    () => ({ state: state as ConfigState, setState, setField, resetState }),
    [state, setField, setState, resetState]
  );

  return <ConfigContext.Provider value={memoizedValue}>{children}</ConfigContext.Provider>;
}
