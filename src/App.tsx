import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "./contexts/VendorContext";
import AuthLoader from "./components/AuthLoader";
import Index from "./pages/Index";
import EmailStep from "./pages/register/EmailStep";
import VerifyStep from "./pages/register/VerifyStep";
import PasswordStep from "./pages/register/PasswordStep";
import CompanyStep from "./pages/register/CompanyStep";
import PendingApproval from "./pages/PendingApproval";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProjects from "./pages/VendorProjects";
import ProjectDetails from "./pages/ProjectDetails";
import NotFound from "./pages/NotFound";

import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient();

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VendorProvider>
          <BrowserRouter>
            <AuthLoader>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/dashboard" element={<VendorDashboard />} />
                <Route path="/projects" element={<VendorProjects />} />
                <Route path="/projects/:projectId" element={<ProjectDetails />} />
                <Route path="/register" element={<EmailStep />} />
                <Route path="/register/verify" element={<VerifyStep />} />
                <Route path="/register/password" element={<PasswordStep />} />
                <Route path="/register/company" element={<CompanyStep />} />
                <Route path="/pending" element={<PendingApproval />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthLoader>
          </BrowserRouter>
        </VendorProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
