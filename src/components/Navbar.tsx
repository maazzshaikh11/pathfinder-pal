import { useAuth } from '@/lib/authContext';
import { CyberButton } from './ui/CyberButton';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Home, ClipboardCheck, LayoutDashboard, Shield, Brain, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { isLoggedIn, role, username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = isLoggedIn && role === 'student' ? [
    { path: '/student-hub', label: 'Hub', icon: Sparkles },
    { path: '/tracks', label: 'Tracks', icon: Home },
    { path: '/assessment', label: 'Assessment', icon: ClipboardCheck },
    { path: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] : isLoggedIn && role === 'tpo' ? [
    { path: '/tpo-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] : [];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isLoggedIn ? (role === 'tpo' ? '/tpo-dashboard' : '/student-hub') : '/'} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center glow-primary">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl text-glow">
              PlacementPal
            </span>
          </Link>

          {/* Navigation Links */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Info & Logout */}
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                  {role === 'tpo' ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="text-primary font-bold">{username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">{username}</span>
                  <span className="text-xs text-muted-foreground uppercase">{role}</span>
                </div>
              </div>
              <CyberButton variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </CyberButton>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
