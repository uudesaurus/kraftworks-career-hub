import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EmployerProtectedRoute } from "@/components/EmployerProtectedRoute";
import EmployerAuth from "./pages/EmployerAuth";
import EmployerRegister from "./pages/EmployerRegister";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerCompany from "./pages/EmployerCompany";
import EmployerJobs from "./pages/EmployerJobs";
import EmployerJobForm from "./pages/EmployerJobForm";
import EmployerApplications from "./pages/EmployerApplications";

const SANDBOX_MODE = import.meta.env.VITE_SANDBOX_MODE === 'true';
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!SANDBOX_MODE && !CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. Set VITE_SANDBOX_MODE=true to bypass.');
}

const queryClient = new QueryClient();

function EmployerRoutes() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/employer" replace />} />
          <Route path="/employer/auth" element={<EmployerAuth />} />
          <Route path="/employer/register" element={<EmployerProtectedRoute><EmployerRegister /></EmployerProtectedRoute>} />
          <Route path="/employer" element={<EmployerProtectedRoute><EmployerDashboard /></EmployerProtectedRoute>} />
          <Route path="/employer/company" element={<EmployerProtectedRoute><EmployerCompany /></EmployerProtectedRoute>} />
          <Route path="/employer/jobs" element={<EmployerProtectedRoute><EmployerJobs /></EmployerProtectedRoute>} />
          <Route path="/employer/jobs/new" element={<EmployerProtectedRoute><EmployerJobForm /></EmployerProtectedRoute>} />
          <Route path="/employer/jobs/:id/edit" element={<EmployerProtectedRoute><EmployerJobForm /></EmployerProtectedRoute>} />
          <Route path="/employer/applications" element={<EmployerProtectedRoute><EmployerApplications /></EmployerProtectedRoute>} />
          <Route path="*" element={<Navigate to="/employer" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const EmployerApp = () => {
  if (SANDBOX_MODE) {
    return (
      <QueryClientProvider client={queryClient}>
        <EmployerRoutes />
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      signInUrl="/employer/auth"
      signUpUrl="/employer/auth"
      afterSignInUrl="/employer"
      afterSignUpUrl="/employer/register"
    >
      <QueryClientProvider client={queryClient}>
        <EmployerRoutes />
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default EmployerApp;
