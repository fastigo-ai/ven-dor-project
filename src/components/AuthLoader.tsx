import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken, getRefreshToken, removeAuthToken, getVendorProfile } from '@/services/authApi';
import { isAdminAuthenticated } from '@/services/adminApi';
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

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith('/admin')
  );

  useEffect(() => {
    const rehydrateAuth = async () => {
      const access_token = getAuthToken();
      const refresh_token = getRefreshToken();

      // If we already have vendor data, no need to refetch
      if (currentVendor) {
        setIsLoading(false);
        return;
      }

      // If no tokens in localStorage, try cookie-only session rehydration
      if (!access_token && !refresh_token) {
        try {
          const result = await getVendorProfile();
          if (result.data) {
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
        } catch (e) {
          // No cookie session
        }
        setIsLoading(false);
        return;
      }

      // Token exists but no vendor data - rehydrate from API
      try {
        const result = await getVendorProfile();
        
        if (result.error) {
          console.log('Token validation failed:', result.error);
          removeAuthToken();
        } else if (result.data) {
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
      }

      setIsLoading(false);
    };

    rehydrateAuth();
  }, []); // Run ONCE on mount

  // Redirect protected routes if not logged in
  useEffect(() => {
    if (isLoading) return;

    if (!currentVendor && !isPublicRoute) {
      // Not logged in and trying to access a protected route
      navigate('/login');
    } else if (currentVendor && (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/')) {
      // Logged in vendor trying to access auth pages or home
      navigate('/dashboard');
    } else if (isAdminAuthenticated() && location.pathname === '/admin/login') {
      // Logged in admin trying to access admin login
      navigate('/admin');
    }
  }, [isLoading, currentVendor, isPublicRoute, navigate, location.pathname]);

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
