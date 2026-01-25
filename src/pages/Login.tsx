import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/lib/authContext';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';
import { motion } from 'framer-motion';
import { Brain, User, Shield, Terminal, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Login = () => {
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !selectedRole) return;
    
    login(username.trim(), selectedRole);
    
    if (selectedRole === 'tpo') {
      navigate('/tpo-dashboard');
    } else {
      navigate('/tracks');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden grid-pattern">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div 
              className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center glow-primary"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-glow mb-4">
            PlacementPal
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto font-medium">
            Skill Gap Intelligence Platform for Campus Placements
          </p>
        </motion.div>

        {/* Login Card */}
        <CyberCard variant="glow" className="w-full max-w-md" delay={0.2}>
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm text-primary">// AUTHENTICATE</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Username
              </label>
              <Input
                type="text"
                placeholder="Enter your username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-muted border-border focus:border-primary focus:ring-primary/20 font-mono"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole('student')}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedRole === 'student'
                      ? 'border-primary bg-primary/10 glow-primary'
                      : 'border-border bg-muted/50 hover:border-primary/50'
                  }`}
                >
                  <User className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-display font-semibold ${selectedRole === 'student' ? 'text-primary' : 'text-foreground'}`}>
                    Student
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole('tpo')}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedRole === 'tpo'
                      ? 'border-accent bg-accent/10 glow-accent'
                      : 'border-border bg-muted/50 hover:border-accent/50'
                  }`}
                >
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'tpo' ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className={`font-display font-semibold ${selectedRole === 'tpo' ? 'text-accent' : 'text-foreground'}`}>
                    TPO Admin
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Submit Button */}
            <CyberButton 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full"
              disabled={!username.trim() || !selectedRole}
              glowing={!!username.trim() && !!selectedRole}
            >
              <Zap className="w-5 h-5 mr-2" />
              Initialize Session
            </CyberButton>
          </form>
        </CyberCard>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl"
        >
          {[
            { icon: Brain, label: 'AI/ML & Cybersecurity Tracks' },
            { icon: Zap, label: 'Real-time Gap Detection' },
            { icon: Shield, label: 'TPO Analytics Dashboard' },
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-muted-foreground">
              <feature.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{feature.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
