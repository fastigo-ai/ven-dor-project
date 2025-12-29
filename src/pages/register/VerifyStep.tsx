import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import AuthLayout from '@/components/AuthLayout';
import StepIndicator from '@/components/StepIndicator';

const OTP_LENGTH = 6;
const CORRECT_OTP = '123456'; // Demo OTP

const VerifyStep = () => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentEmail, setIsVerified } = useVendor();

  useEffect(() => {
    if (!currentEmail) {
      navigate('/register');
    }
  }, [currentEmail, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < OTP_LENGTH) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (otpString === CORRECT_OTP) {
      setIsVerified(true);
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified",
      });
      navigate('/register/password');
    } else {
      setError('Invalid verification code. Try 123456 for demo.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    toast({
      title: "OTP Resent",
      description: `A new verification code has been sent to ${currentEmail}`,
    });
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`Enter the 6-digit code sent to ${currentEmail || 'your email'}`}
    >
      <StepIndicator
        currentStep={1}
        totalSteps={4}
        labels={['Email', 'Verify', 'Password', 'Company']}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-11 h-14 text-center text-xl font-display font-semibold border border-input rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                autoFocus={index === 0}
              />
            ))}
          </div>
          
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Demo: Use code <span className="font-mono font-semibold text-foreground">123456</span>
          </p>
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </Button>

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{resendTimer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary hover:underline font-medium"
            >
              Resend verification code
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};

export default VerifyStep;
