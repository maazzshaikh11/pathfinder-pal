import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/lib/authContext';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background grid-pattern">
    <motion.div
      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center glow-primary"
    >
      <Brain className="w-8 h-8 text-primary" />
    </motion.div>
  </div>
);

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isLoggedIn, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) {
    // Redirect to correct home if wrong role
    return <Navigate to={role === 'tpo' ? '/tpo-dashboard' : '/student-home'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
