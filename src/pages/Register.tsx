import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';
import { motion } from 'framer-motion';
import { Brain, Terminal, Zap, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CursorGlow from '@/components/CursorGlow';

const ALLOWED_DOMAIN = 'apsit.edu.in';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      return `Only @${ALLOWED_DOMAIN} email addresses are permitted.`;
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return '';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden grid-pattern flex items-center justify-center">
        <CursorGlow color="primary" size={250} />
        <CyberCard variant="glow" className="w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-glow mb-3">Registration Successful!</h2>
          <p className="text-muted-foreground mb-6">
            A verification link has been sent to <span className="text-primary font-mono">{email}</span>.
            Please check your inbox and confirm your email to activate your account.
          </p>
          <CyberButton variant="primary" className="w-full" onClick={() => navigate('/')}>
            Go to Login
          </CyberButton>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden grid-pattern">
      <CursorGlow color="primary" size={250} />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center glow-primary">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-glow mb-3">
            PlacementPal
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Create your APSIT student account
          </p>
        </motion.div>

        {/* Register Card */}
        <CyberCard variant="glow" className="w-full max-w-md" delay={0.2}>
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm text-primary">// CREATE_ACCOUNT</span>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                APSIT Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={`you@${ALLOWED_DOMAIN}`}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="pl-10 bg-muted border-border focus:border-primary font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="pl-10 bg-muted border-border focus:border-primary font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className="pl-10 bg-muted border-border focus:border-primary font-mono"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Domain restriction notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted border border-border">
              <User className="w-4 h-4 text-primary shrink-0" />
              Registration is restricted to <span className="text-primary font-mono mx-1">@{ALLOWED_DOMAIN}</span> email addresses only.
            </div>

            <CyberButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
              glowing={!loading}
            >
              <Zap className="w-5 h-5 mr-2" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </CyberButton>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CyberCard>
      </div>
    </div>
  );
};

export default Register;
