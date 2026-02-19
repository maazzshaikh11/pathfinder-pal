import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, GraduationCap, ArrowUpCircle, ArrowDownCircle,
  Search, RefreshCw, CheckCircle, XCircle, Loader2,
  Mail, Calendar, Clock, ChevronDown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManagedUser {
  id: string;
  email: string;
  role: 'student' | 'tpo';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
}

const TPOUsersManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'tpo'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const callManageUsers = async (action: string, body?: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/manage-users?action=${action}`;

    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await callManageUsers('list');
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetRole = async (targetUserId: string, newRole: 'student' | 'tpo') => {
    setUpdatingId(targetUserId);
    try {
      await callManageUsers('set-role', { targetUserId, newRole });
      setUsers(prev =>
        prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u)
      );
      toast({
        title: 'Role Updated',
        description: `User has been ${newRole === 'tpo' ? 'promoted to TPO Admin' : 'demoted to Student'}.`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const tpoCount = users.filter(u => u.role === 'tpo').length;
  const studentCount = users.filter(u => u.role === 'student').length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen relative grid-pattern">
      <CursorGlow color="accent" size={250} />
      <Navbar />

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-40 left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-accent" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              User <span className="text-glow">Management</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Manage all registered APSIT users and their roles</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'primary' },
            { label: 'Students', value: studentCount, icon: GraduationCap, color: 'accent' },
            { label: 'TPO Admins', value: tpoCount, icon: Shield, color: 'secondary' },
            { label: 'Confirmed', value: users.filter(u => u.email_confirmed).length, icon: CheckCircle, color: 'success' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CyberCard className="text-center py-4">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 text-${stat.color}`} />
                <p className="font-display font-bold text-2xl text-foreground">{loading ? '—' : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CyberCard>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <CyberCard variant="glow" className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-border font-mono"
              />
            </div>

            {/* Role filter pills */}
            <div className="flex gap-2 shrink-0">
              {(['all', 'student', 'tpo'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 text-sm font-mono rounded-full border transition-all ${
                    roleFilter === r
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {r === 'all' ? 'All' : r === 'tpo' ? 'TPO' : 'Students'}
                </button>
              ))}
            </div>

            <CyberButton variant="ghost" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </CyberButton>
          </div>
        </CyberCard>

        {/* User Table */}
        <CyberCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Registered Users</h2>
            <span className="text-sm font-mono text-muted-foreground">{filtered.length} users</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-3 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Registered</th>
                    <th className="text-left py-3 px-3 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Last Active</th>
                    <th className="text-left py-3 px-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="text-right py-3 px-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((u, i) => {
                      const isCurrentUser = u.id === currentUser?.id;
                      const isUpdating = updatingId === u.id;

                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                        >
                          {/* Email */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center border text-sm font-bold ${
                                u.role === 'tpo'
                                  ? 'bg-accent/20 border-accent/50 text-accent'
                                  : 'bg-primary/20 border-primary/50 text-primary'
                              }`}>
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-mono text-sm font-medium">{u.email}</p>
                                {isCurrentUser && (
                                  <span className="text-xs text-muted-foreground">(you)</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Registered date */}
                          <td className="py-3 px-3 hidden md:table-cell">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(u.created_at)}
                            </div>
                          </td>

                          {/* Last sign in */}
                          <td className="py-3 px-3 hidden lg:table-cell">
                            <div className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(u.last_sign_in_at)}
                              </div>
                              <div className="text-muted-foreground/60">{formatTime(u.last_sign_in_at)}</div>
                            </div>
                          </td>

                          {/* Email confirmed */}
                          <td className="py-3 px-3">
                            {u.email_confirmed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <XCircle className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Role badge */}
                          <td className="py-3 px-3">
                            {u.role === 'tpo' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/40">
                                <Shield className="w-3 h-3" />
                                TPO Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/30">
                                <GraduationCap className="w-3 h-3" />
                                Student
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-right">
                            {isCurrentUser ? (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            ) : isUpdating ? (
                              <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
                            ) : u.role === 'student' ? (
                              <CyberButton
                                variant="accent"
                                size="sm"
                                onClick={() => handleSetRole(u.id, 'tpo')}
                                className="ml-auto"
                              >
                                <ArrowUpCircle className="w-3.5 h-3.5 mr-1" />
                                Promote to TPO
                              </CyberButton>
                            ) : (
                              <CyberButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetRole(u.id, 'student')}
                                className="ml-auto border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />
                                Demote to Student
                              </CyberButton>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CyberCard>
      </div>
    </div>
  );
};

export default TPOUsersManagement;
