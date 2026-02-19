import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { StudentResult, TrackType } from './mockData';

export type UserRole = 'student' | 'tpo' | null;

export interface AIPrediction {
  level: 'Beginner' | 'Intermediate' | 'Ready';
  confidence: number;
  skillGaps: Array<{
    skill: string;
    gapType: 'Conceptual' | 'Practical';
    priority: 'High' | 'Medium' | 'Low';
  }>;
  recommendations: string[];
  estimatedReadinessWeeks: number;
}

export interface EnhancedStudentResult extends StudentResult {
  aiPrediction?: AIPrediction;
  questionResponses?: Array<{
    questionId: string;
    topic: string;
    isCorrect: boolean;
    difficulty: string;
  }>;
}

interface AuthContextType {
  isLoggedIn: boolean;
  role: UserRole;
  username: string;
  user: User | null;
  session: Session | null;
  studentResult: EnhancedStudentResult | null;
  loading: boolean;
  login: (username: string, role: UserRole) => void; // kept for legacy compat
  logout: () => Promise<void>;
  setStudentResult: (result: EnhancedStudentResult) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [studentResult, setStudentResultState] = useState<EnhancedStudentResult | null>(null);

  const fetchRole = async (userId: string): Promise<UserRole> => {
    const { data, error } = await supabase
      .rpc('get_user_role', { _user_id: userId });
    if (error || !data) return 'student';
    return data as UserRole;
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Defer role fetch to avoid Supabase deadlock
          setTimeout(async () => {
            const r = await fetchRole(currentSession.user.id);
            setRole(r);
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setStudentResultState(null);
  };

  // Legacy login kept for non-breaking compatibility with older pages
  const login = (username: string, r: UserRole) => {
    setRole(r);
  };

  const username = user?.email?.split('@')[0] ?? '';
  const isLoggedIn = !!user && !!session;

  const setStudentResult = (result: EnhancedStudentResult) => {
    setStudentResultState(result);
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      role,
      username,
      user,
      session,
      studentResult,
      loading,
      login,
      logout,
      setStudentResult,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
