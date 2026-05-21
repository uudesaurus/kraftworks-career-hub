import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeedbackGenerationProvider } from '@/contexts/FeedbackGenerationContext';
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import ResumeReview from "./pages/ResumeReview";
import InterviewPrep from "./pages/InterviewPrep";
import CareerToolkit from "./pages/CareerToolkit";
import CareerToolkitHVAC from "./pages/CareerToolkitHVAC";
import CareerToolkitElectrical from "./pages/CareerToolkitElectrical";
import CareerToolkitWelding from "./pages/CareerToolkitWelding";
import ArticlePage from "./pages/ArticlePage";
import CareerFair from "./pages/CareerFair";
import JobDetail from "./pages/JobDetail";
import Blog from "./pages/Blog";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import Waitlist from "./pages/Waitlist";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const SANDBOX_MODE = import.meta.env.VITE_SANDBOX_MODE === 'true';
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!SANDBOX_MODE && !CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. Set VITE_SANDBOX_MODE=true to bypass.');
}

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FeedbackGenerationProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/resume-review" element={<ProtectedRoute><ResumeReview /></ProtectedRoute>} />
          <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
          <Route path="/career-toolkit" element={<CareerToolkit />} />
          <Route path="/career-toolkit/hvac" element={<CareerToolkitHVAC />} />
          <Route path="/career-toolkit/electrical" element={<CareerToolkitElectrical />} />
          <Route path="/career-toolkit/welding" element={<CareerToolkitWelding />} />
          <Route path="/career-toolkit/articles/:slug" element={<ArticlePage />} />
          <Route path="/career-fair" element={<CareerFair />} />
          <Route path="/career-fair/jobs/:id" element={<JobDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </FeedbackGenerationProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const App = () => {
  if (SANDBOX_MODE) {
    // In sandbox mode, skip Clerk — useAuth returns a mock user
    return (
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
