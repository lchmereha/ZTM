import type { Empresa, Filial, Usuario } from 'models';
import { createContext, useContext, useState } from 'react';
import axios from 'utils/axios';

// ── Auth-specific types ──────────────────────────────────────

/** User object stored in auth context (backend-provided on login) */
export interface AuthUser extends Omit<Usuario, 'senha'> {
  empresa?: Empresa | null;
  empresas?: AuthEmpresa[];
  filiais?: AuthFilial[];
  permissoes?: AuthPermissao[];
}

/** Permission entry associated with the user */
export interface AuthPermissao {
  chave: string;
  podeVisualizar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
}

/** Empresa binding returned by the login endpoint */
export interface AuthEmpresa {
  id: number;
  nome: string;
  logo?: string | null;
  corEsquema?: string | null;
}

/** Filial binding for the active user session */
export interface AuthFilial {
  idFilial: number;
  idEmpresa: number;
  nome: string;
  idUsuario?: number;
  filial?: Filial;
}

/** Branding derived from the user's empresa */
export interface Branding {
  logo: string | null;
  primaryColor: string | null;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AuthUser | null;
  branding: Branding;
  activeFilial: AuthFilial | null;
  changeActiveFilial: (filial: AuthFilial) => void;
  login: (userData: AuthUser | null, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Read persisted auth state from storage (runs once during initial render) */
function readPersistedAuth(): {
  user: AuthUser | null;
  activeFilial: AuthFilial | null;
  branding: Branding;
  isAuthenticated: boolean;
} {
  try {
    const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (!storedUser) {
      return { user: null, activeFilial: null, branding: { logo: null, primaryColor: null }, isAuthenticated: false };
    }

    const parsedUser: AuthUser = JSON.parse(storedUser);

    let activeFilial: AuthFilial | null = null;
    const storedFilial = window.localStorage.getItem('activeFilial') || window.sessionStorage.getItem('activeFilial');
    if (storedFilial) {
      activeFilial = JSON.parse(storedFilial);
    } else if (parsedUser.filiais && parsedUser.filiais.length > 0) {
      activeFilial = parsedUser.filiais[0];
    }

    // Derivar branding da empresa da filial ativa
    let branding: Branding = { logo: null, primaryColor: null };
    if (activeFilial && parsedUser.empresas) {
      const emp = parsedUser.empresas.find((e) => e.id === activeFilial.idEmpresa);
      if (emp) {
        branding = { logo: emp.logo ?? null, primaryColor: emp.corEsquema ?? null };
      }
    } else if (parsedUser.empresa) {
      branding = { logo: parsedUser.empresa.logo ?? null, primaryColor: parsedUser.empresa.corEsquema ?? null };
    }

    // If user data exists, assume authenticated (cookie will validate on next request)
    return { user: parsedUser, activeFilial, branding, isAuthenticated: true };
  } catch {
    // Corrupted storage — clear everything
    window.localStorage.removeItem('user');
    window.sessionStorage.removeItem('user');
    window.localStorage.removeItem('activeFilial');
    window.sessionStorage.removeItem('activeFilial');
    return { user: null, activeFilial: null, branding: { logo: null, primaryColor: null }, isAuthenticated: false };
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const persisted = readPersistedAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(persisted.isAuthenticated);
  const [user, setUser] = useState<AuthUser | null>(persisted.user);
  const [activeFilial, setActiveFilial] = useState<AuthFilial | null>(persisted.activeFilial);
  const [branding, setBranding] = useState<Branding>(persisted.branding);

  const logout = async () => {
    try {
      // Server clears the httpOnly cookie
      await axios.post('/auth/logout');
    } catch {
      // Even if the API call fails, clean up local state
    }
    window.localStorage.removeItem('user');
    window.sessionStorage.removeItem('user');
    window.localStorage.removeItem('activeFilial');
    window.sessionStorage.removeItem('activeFilial');
    setIsAuthenticated(false);
    setUser(null);
    setActiveFilial(null);
    setBranding({ logo: null, primaryColor: null });
  };

  const login = async (userData: AuthUser | null, rememberMe = true) => {
    // Token is already set as httpOnly cookie by the server — no need to store it
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    if (userData) {
      storage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      if (userData.filiais && userData.filiais.length > 0) {
        setActiveFilial(userData.filiais[0]);
        storage.setItem('activeFilial', JSON.stringify(userData.filiais[0]));
      }
      if (userData.empresa) {
        setBranding({
          logo: userData.empresa.logo ?? null,
          primaryColor: userData.empresa.corEsquema ?? null
        });
      }
    }
    setIsAuthenticated(true);
  };

  const changeActiveFilial = (filial: AuthFilial) => {
    setActiveFilial(filial);
    const storage = window.localStorage.getItem('user') ? window.localStorage : window.sessionStorage;
    storage.setItem('activeFilial', JSON.stringify(filial));

    // Atualizar branding com base na empresa da filial selecionada
    const empresa = user?.empresas?.find((e) => e.id === filial.idEmpresa);
    if (empresa) {
      setBranding({
        logo: empresa.logo ?? null,
        primaryColor: empresa.corEsquema ?? null
      });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitialized: true, user, branding, activeFilial, changeActiveFilial, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Auth context must be used inside AuthProvider');
  return context;
};
