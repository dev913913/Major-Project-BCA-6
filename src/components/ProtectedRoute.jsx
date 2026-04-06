import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, isAdmin, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) return <p>Loading...</p>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
