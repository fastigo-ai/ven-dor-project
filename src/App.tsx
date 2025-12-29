import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "./contexts/VendorContext";
import Index from "./pages/Index";
import EmailStep from "./pages/register/EmailStep";
import VerifyStep from "./pages/register/VerifyStep";
import PasswordStep from "./pages/register/PasswordStep";
import CompanyStep from "./pages/register/CompanyStep";
import PendingApproval from "./pages/PendingApproval";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VendorProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<EmailStep />} />
            <Route path="/register/verify" element={<VerifyStep />} />
            <Route path="/register/password" element={<PasswordStep />} />
            <Route path="/register/company" element={<CompanyStep />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VendorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
