import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import AuthLayout from '@/components/AuthLayout';
import StepIndicator from '@/components/StepIndicator';
import { z } from 'zod';
import { registerEmail, loginWithGoogle, setAuthToken } from '@/services/authApi';
import { GoogleLogin } from '@react-oauth/google';

const emailSchema = z.string().email('Please enter a valid email address');

const EmailStep = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentEmail, setIsVerified, setIsGoogleUser, loadBackendProjects } = useVendor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    // Call API to send OTP
    const response = await registerEmail(email);

    if (response.error) {
      setError(response.error);
      setIsLoading(false);
      return;
    }

    setCurrentEmail(email);
    toast({
      title: "OTP Sent",
      description: `A verification code has been sent to ${email}`,
    });
    
    setIsLoading(false);
    navigate('/register/verify');
  };

  return (
    <AuthLayout
      title="Vendor Registration"
      subtitle="Start by entering your email address"
    >
      <StepIndicator
        currentStep={0}
        totalSteps={4}
        labels={['Email', 'Verify', 'Password', 'Company']}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="vendor@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending OTP...
            </span>
          ) : (
            'Send Verification Code'
          )}
        </Button>
      </form>

      <div className="relative mt-6 mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-semibold">
            Or Sign up with
          </span>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (credentialResponse.credential) {
              const response = await loginWithGoogle(credentialResponse.credential);
              
              if (response.data?.user?.status === 'DRAFT' || response.data?.user?.profile_status !== 'COMPLETED') {
                setCurrentEmail(response.data?.user?.email || '');
                setIsVerified(true);
                setIsGoogleUser(true);
                
                if (response.data?.access_token) setAuthToken(response.data.access_token);
                
                toast({ 
                  title: 'Google Identity Verified', 
                  description: 'Please set a password to secure your account.' 
                });
                
                if (!response.data?.user?.password_set) {
                  navigate('/register/password');
                } else {
                  navigate('/register/company');
                }
                return;
              }

              if (response.error) {
                toast({
                  variant: 'destructive',
                  title: 'Authentication failed',
                  description: response.error,
                });
                return;
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

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <a href="/login" className="text-primary hover:underline font-medium">
          Sign in here
        </a>
      </p>
    </AuthLayout>
  );
};

export default EmailStep;
