import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/AuthLayout';
import { forgotPassword, resetPassword } from '@/services/authApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /\d/.test(newPassword) },
    { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];

  const allRequirementsMet = requirements.every((req) => req.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // Call API to send reset OTP
    const response = await forgotPassword(data.email);

    if (response.error) {
      setFormError('email', {
        message: response.error,
      });
      return;
    }

    setSubmittedEmail(data.email);
    setStep('otp');
  };

  const handleResetPassword = async () => {
    if (!allRequirementsMet || !passwordsMatch) {
      setError('Please meet all password requirements');
      return;
    }

    setIsResetting(true);
    setError('');

    const response = await resetPassword(submittedEmail, otp, newPassword);

    if (response.error) {
      setError(response.error);
      setIsResetting(false);
      return;
    }

    setStep('success');
    toast({
      title: "Password Reset",
      description: "Your password has been successfully reset",
    });
  };

  if (step === 'success') {
    return (
      <AuthLayout
        title="Password Reset"
        subtitle="Your password has been successfully reset"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          
          <p className="text-muted-foreground">
            You can now login with your new password.
          </p>

          <Link to="/login">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle={`Enter the OTP sent to ${submittedEmail}`}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && (
              <div className={cn(
                "flex items-center gap-1.5 text-sm",
                passwordsMatch ? "text-success" : "text-destructive"
              )}>
                {passwordsMatch ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {passwordsMatch ? "Passwords match" : "Passwords don't match"}
              </div>
            )}
          </div>

          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Password Requirements</p>
            {requirements.map((req, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  req.met ? "text-success" : "text-muted-foreground"
                )}
              >
                {req.met ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                )}
                {req.label}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button 
            onClick={handleResetPassword} 
            className="w-full" 
            disabled={isResetting || !otp || !allRequirementsMet || !passwordsMatch}
          >
            {isResetting ? 'Resetting...' : 'Reset Password'}
          </Button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm text-primary hover:underline"
          >
            Try with different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to reset your password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset OTP'}
        </Button>

        <Link to="/login" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
