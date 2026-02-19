import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import TrackSelection from "./pages/TrackSelection";
import Assessment from "./pages/Assessment";
import StudentDashboard from "./pages/StudentDashboard";
import TPODashboard from "./pages/TPODashboard";
import TPOChat from "./pages/TPOChat";
import TPOUsersManagement from "./pages/TPOUsersManagement";
import StudentChat from "./pages/StudentChat";
import NotFound from "./pages/NotFound";
import StudentHome from "./pages/StudentHome";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import LearningPath from "./pages/LearningPath";

const queryClient = new QueryClient();

// Root redirect: if already logged in, skip login screen
const RootRoute = () => {
  const { isLoggedIn, role, loading } = useAuth();
  if (loading) return null;
  if (isLoggedIn) {
    return <Navigate to={role === 'tpo' ? '/tpo-dashboard' : '/student-home'} replace />;
  }
  return <Index />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/register" element={<Register />} />

            {/* Student-only routes */}
            <Route path="/student-home" element={<ProtectedRoute requiredRole="student"><StudentHome /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute requiredRole="student"><ResumeAnalysis /></ProtectedRoute>} />
            <Route path="/tracks" element={<ProtectedRoute requiredRole="student"><TrackSelection /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute requiredRole="student"><Assessment /></ProtectedRoute>} />
            <Route path="/learning-path" element={<ProtectedRoute requiredRole="student"><LearningPath /></ProtectedRoute>} />
            <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student-chat" element={<ProtectedRoute requiredRole="student"><StudentChat /></ProtectedRoute>} />

            {/* TPO-only routes */}
            <Route path="/tpo-dashboard" element={<ProtectedRoute requiredRole="tpo"><TPODashboard /></ProtectedRoute>} />
            <Route path="/tpo-users" element={<ProtectedRoute requiredRole="tpo"><TPOUsersManagement /></ProtectedRoute>} />
            <Route path="/tpo-chat" element={<ProtectedRoute requiredRole="tpo"><TPOChat /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
