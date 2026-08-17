import { useAuth } from 'contexts/AuthContext';
import type { UsuarioRole } from 'models/enums';
import { Navigate } from 'react-router-dom';

/**
 * Protege rotas que exigem um role específico.
 * Se o usuário não possuir a role necessária, redireciona para a home.
 *
 * Uso: <RoleGuard roles={['ADMIN']}><AdminPage /></RoleGuard>
 */

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UsuarioRole[];
}

export default function RoleGuard({ children, roles = [] }: RoleGuardProps) {
  const { user } = useAuth();
  const userRegra = user?.regra || 'OPERADOR';

  if (roles.length > 0 && !roles.includes(userRegra)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
