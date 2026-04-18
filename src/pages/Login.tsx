import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/AuthLayout';
import { useVendor } from '@/contexts/VendorContext';
import { toast } from '@/hooks/use-toast';
import { loginUser, getVendorProfile, loginWithGoogle } from '@/services/authApi';
import { GoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { 
    setCurrentVendor, 
    loadBackendProjects, 
    setCurrentEmail, 
    setIsVerified, 
    setIsGoogleUser 
  } = useVendor();
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'pending' | 'rejected' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setStatusMessage(null);
    
    // Call API to login
    const response = await loginUser(data.email, data.password);

    if (response.error) {
      if (response.error === 'PENDING_APPROVAL') {
        setStatusMessage({
          type: 'pending',
          message: 'Your account is under review. Please wait for admin approval.',
        });
        return;
      }
      
      setStatusMessage({
        type: 'error',
        message: response.error,
      });
      return;
    }

    // Tokens are now strictly handled by HttpOnly cookies

    // Fetch vendor profile from backend
    const profileResponse = await getVendorProfile();
    
    if (profileResponse.error) {
      // Profile fetch failed - set a minimal vendor for dashboard access
      // This handles case where GET /vendor/profile endpoint isn't available yet
      setCurrentVendor({
        id: 'temp-' + Date.now(),
        email: data.email,
        companyName: '',
        gstNumber: '',
        registrationNumber: '',
        businessAddress: '',
        contactPersonName: '',
        phoneNumber: '',
        websiteUrl: '',
        status: 'approved', // Only approved users can login successfully
        createdAt: new Date(),
      });
    } else if (profileResponse.data) {
      const profile = profileResponse.data;
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
        status: (profile.status || 'approved').toLowerCase() as any,
        createdAt: new Date(),
      });
    }

    // Fetch vendor's projects from backend
    await loadBackendProjects();

    toast({
      title: 'Welcome back!',
      description: `Logged in successfully`,
    });
    navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Vendor Login"
      subtitle="Sign in to access your vendor portal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {statusMessage && (
          <Alert
            variant={statusMessage.type === 'error' ? 'destructive' : 'default'}
            className={
              statusMessage.type === 'pending'
                ? 'border-warning bg-warning/10 text-warning-foreground'
                : statusMessage.type === 'rejected'
                ? 'border-destructive bg-destructive/10'
                : ''
            }
          >
            {statusMessage.type === 'pending' && (
              <Clock className="h-4 w-4 text-warning" />
            )}
            {statusMessage.type === 'rejected' && (
              <XCircle className="h-4 w-4" />
            )}
            {statusMessage.type === 'error' && (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className="ml-2">
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="vendor@company.com"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                const response = await loginWithGoogle(credentialResponse.credential);
                
                // Handle the unified registration flow for Google (DRAFT status)
                if (response.data?.user?.status === 'DRAFT') {
                  setCurrentEmail(response.data?.user?.email || '');
                  setIsVerified(true);
                  setIsGoogleUser(true);
                  
                  // Tokens handled by HttpOnly cookies
                  
                  toast({ 
                    title: 'Google Identity Verified', 
                    description: 'Please set a password to secure your account.' 
                  });
                  
                  // Decide where to send them based on what's missing
                  if (!response.data?.user?.password_set) {
                    navigate('/register/password');
                  } else {
                    navigate('/register/company');
                  }
                  return;
                }

                if (response.error) {
                  if (response.error === 'PENDING_APPROVAL') {
                    setStatusMessage({
                      type: 'pending',
                      message: 'Your account is under review. Please wait for admin approval.',
                    });
                    return;
                  }
                  toast({
                    variant: 'destructive',
                    title: 'Authentication failed',
                    description: response.error,
                  });
                  return;
                }
                
                // Fetch profile and navigate
                if (response.data?.user) {
                  const profile = response.data.user;
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
                    status: (profile.status || '').toLowerCase() as any,
                    createdAt: new Date(),
                  });
                   await getVendorProfile().then(res => {
                     if (res.data) {
                       setCurrentVendor({
                         id: res.data._id,
                         email: res.data.email,
                         companyName: res.data.company_name || '',
                         gstNumber: res.data.gst_number || '',
                         registrationNumber: res.data.registration_number || '',
                         businessAddress: res.data.business_address || '',
                         contactPersonName: res.data.contact_person_name || '',
                         phoneNumber: res.data.phone_number || '',
                         websiteUrl: res.data.website_url || '',
                         status: (res.data.status || '').toLowerCase() as any,
                         createdAt: new Date(),
                       });
                     }
                   });
                }

                await loadBackendProjects();
                toast({ title: 'Welcome!', description: 'Logged in with Google' });
                navigate('/dashboard');
              }
            }}
            onError={() => {
              toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Google authentication failed',
              });
            }}
            useOneTap
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Register as Vendor
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
