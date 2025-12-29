import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import AuthLayout from '@/components/AuthLayout';
import StepIndicator from '@/components/StepIndicator';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PasswordStep = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isVerified } = useVendor();

  useEffect(() => {
    if (!isVerified) {
      navigate('/register');
    }
  }, [isVerified, navigate]);

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allRequirementsMet = requirements.every((req) => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast({
        title: "Weak Password",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Password Set",
      description: "Please complete your company registration",
    });
    
    navigate('/register/company');
  };

  return (
    <AuthLayout
      title="Create Password"
      subtitle="Set a secure password for your account"
    >
      <StepIndicator
        currentStep={2}
        totalSteps={4}
        labels={['Email', 'Verify', 'Password', 'Company']}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
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
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
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

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading || !allRequirementsMet || !passwordsMatch}
        >
          {isLoading ? 'Creating Account...' : 'Continue to Company Details'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default PasswordStep;
