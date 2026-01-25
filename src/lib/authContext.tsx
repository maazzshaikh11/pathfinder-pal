import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StudentResult } from './mockData';

export type UserRole = 'student' | 'tpo' | null;

interface AuthContextType {
  isLoggedIn: boolean;
  role: UserRole;
  username: string;
  studentResult: StudentResult | null;
  login: (username: string, role: UserRole) => void;
  logout: () => void;
  setStudentResult: (result: StudentResult) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [username, setUsername] = useState('');
  const [studentResult, setStudentResultState] = useState<StudentResult | null>(null);

  const login = (username: string, role: UserRole) => {
    setIsLoggedIn(true);
    setRole(role);
    setUsername(username);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setUsername('');
    setStudentResultState(null);
  };

  const setStudentResult = (result: StudentResult) => {
    setStudentResultState(result);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      role, 
      username, 
      studentResult,
      login, 
      logout,
      setStudentResult
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
