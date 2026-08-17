import { useSnackbar } from 'hooks/useSnackbar';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Protege rotas verificando se o usuário tem a permissão de visualização (podeVisualizar)
 * para a chave especificada.
 * Redireciona para o dashboard '/' e exibe um snackbar se bloqueado.
 *
 * Uso: <PermissionGuard permissionKey="CAD_EMPRESA"><EmpresaPage /></PermissionGuard>
 */

interface PermissionGuardProps {
  children: React.ReactNode;
  permissionKey?: string;
  roles?: string[];
}

export default function PermissionGuard({ children, permissionKey, roles }: PermissionGuardProps) {
  const { user } = useAuth();
  const { podeVisualizar } = usePermissions(permissionKey);
  const { showSnackbar } = useSnackbar();

  const navigate = useNavigate();

  const hasRole = roles ? !!user?.regra && roles.includes(user.regra) : true;
  const isAllowed = podeVisualizar && hasRole;

  useEffect(() => {
    if (!isAllowed) {
      showSnackbar({
        message: 'Você não possui permissão para acessar esta página.',
        severity: 'error'
      });
      navigate('/', { replace: true });
    }
  }, [isAllowed, showSnackbar, navigate]);

  if (!isAllowed) {
    return null; // prevents rendering the protected content before redirect
  }

  return <>{children}</>;
}
