import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken, removeAuthToken, getVendorProfile } from '@/services/authApi';
import { useVendor } from '@/contexts/VendorContext';
import { Loader2 } from 'lucide-react';

interface AuthLoaderProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/register/verify',
  '/register/password',
  '/register/company',
  '/forgot-password',
  '/pending',
  '/admin/login',
  '/admin',
];

const AuthLoader = ({ children }: AuthLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { currentVendor, setCurrentVendor } = useVendor();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rehydrateAuth = async () => {
      const token = getAuthToken();
      const isPublicRoute = PUBLIC_ROUTES.some(route => 
        location.pathname === route || location.pathname.startsWith('/admin')
      );

      // If no token, allow public routes, redirect protected routes to login
      if (!token) {
        setIsLoading(false);
        if (!isPublicRoute && location.pathname === '/dashboard') {
          navigate('/login');
        }
        return;
      }

      // If we already have vendor data, no need to refetch
      if (currentVendor) {
        setIsLoading(false);
        return;
      }

      // Token exists but no vendor data - rehydrate from API
      try {
        const result = await getVendorProfile();
        
        if (result.error) {
          // Token is invalid or expired
          console.log('Token validation failed:', result.error);
          removeAuthToken();
          setIsLoading(false);
          if (!isPublicRoute) {
            navigate('/login');
          }
          return;
        }

        if (result.data) {
          // Successfully rehydrated vendor data
          const profile = result.data;
          setCurrentVendor({
            id: profile._id,
            email: profile.email,
            companyName: profile.company_name || '',
            gstNumber: profile.gst_number || '',
            registrationNumber: profile.registration_number || '',
            businessAddress: profile.business_address || '',
            contactPersonName: profile.contact_person_name || '',
            phoneNumber: profile.phone_number || '',
            websiteUrl: profile.website_url || '',
            status: profile.status?.toLowerCase() === 'approved' ? 'approved' : 
                   profile.status?.toLowerCase() === 'pending' ? 'pending' : 'rejected',
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Auth rehydration error:', error);
        removeAuthToken();
        if (!isPublicRoute) {
          navigate('/login');
        }
      }

      setIsLoading(false);
    };

    rehydrateAuth();
  }, [location.pathname]); // Re-run on route change

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthLoader;
