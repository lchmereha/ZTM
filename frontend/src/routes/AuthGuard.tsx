import { useAuth } from 'contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// ==============================|| AUTH GUARD ||============================== //

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthGuard;
