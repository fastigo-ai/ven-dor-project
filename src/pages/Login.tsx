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
import { loginUser, setAuthToken, getVendorProfile } from '@/services/authApi';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentVendor, loadBackendProjects } = useVendor();
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

    // Store the auth token
    if (response.data?.access_token) {
      setAuthToken(response.data.access_token);
    }

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
        status: 'approved', // Only approved users can login
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
