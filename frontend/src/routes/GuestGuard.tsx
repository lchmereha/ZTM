import { useAuth } from 'contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// ==============================|| GUEST GUARD ||============================== //

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * Guest guard for routes having no auth required
 */
const GuestGuard = ({ children }: GuestGuardProps) => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestGuard;
