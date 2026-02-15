import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/authContext";
import Index from "./pages/Index";
import TrackSelection from "./pages/TrackSelection";
import Assessment from "./pages/Assessment";
import StudentDashboard from "./pages/StudentDashboard";
import TPODashboard from "./pages/TPODashboard";
import TPOChat from "./pages/TPOChat";
import StudentChat from "./pages/StudentChat";
import NotFound from "./pages/NotFound";
import StudentHome from "./pages/StudentHome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/student-home" element={<StudentHome />} />
            <Route path="/tracks" element={<TrackSelection />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-chat" element={<StudentChat />} />
            <Route path="/tpo-dashboard" element={<TPODashboard />} />
            <Route path="/tpo-chat" element={<TPOChat />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
