import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/contexts/VendorContext';
import AuthLayout from '@/components/AuthLayout';
import StepIndicator from '@/components/StepIndicator';
import { createVendorProfile } from '@/services/authApi';
import { z } from 'zod';

const companySchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(100),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format'),
  registrationNumber: z.string().min(5, 'Registration number is required').max(50),
  businessAddress: z.string().min(10, 'Please enter a complete address').max(500),
  contactPersonName: z.string().min(2, 'Contact name is required').max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  websiteUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

const CompanyStep = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    registrationNumber: '',
    businessAddress: '',
    contactPersonName: '',
    phoneNumber: '',
    websiteUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    currentEmail, 
    isVerified, 
    addVendor, 
    isGoogleUser,
    setCurrentVendor,
    currentVendor
  } = useVendor();

  useEffect(() => {
    // Both OTP verified users and Google authenticated users (in DRAFT mode) can access this
    if (!isVerified && !isGoogleUser) {
      navigate('/register');
    }
  }, [isVerified, isGoogleUser, navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = companySchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // Call vendor profile API
    const response = await createVendorProfile({
      company_name: formData.companyName,
      gst_number: formData.gstNumber,
      registration_number: formData.registrationNumber,
      business_address: formData.businessAddress,
      contact_person_name: formData.contactPersonName,
      phone_number: formData.phoneNumber,
      website_url: formData.websiteUrl || undefined,
    });

    setIsLoading(false);

    if (response.error) {
      toast({
        title: "Submission Failed",
        description: response.error,
        variant: "destructive",
      });
      return;
    }

    // Update local vendor context status to pending
    if (currentVendor) {
      setCurrentVendor({
        ...currentVendor,
        ...formData,
        status: 'pending'
      } as any);
    } else {
      // For demo or edge cases where context was lost
      addVendor({
        email: currentEmail,
        ...formData,
      });
    }
    
    // Clear registration flags
    // (Wait for navigation to complete)
    setTimeout(() => {
      navigate('/pending');
    }, 100);
  };

  return (
    <AuthLayout
      title="Company Details"
      subtitle="Complete your company registration"
    >
      <StepIndicator
        currentStep={3}
        totalSteps={4}
        labels={['Email', 'Verify', 'Password', 'Company']}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="Acme Technologies Pvt Ltd"
            required
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST Number *</Label>
            <Input
              id="gstNumber"
              value={formData.gstNumber}
              onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
              placeholder="27AABCU9603R1ZM"
              required
            />
            {errors.gstNumber && (
              <p className="text-sm text-destructive">{errors.gstNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number *</Label>
            <Input
              id="registrationNumber"
              value={formData.registrationNumber}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
              placeholder="U72200MH2020PTC123456"
              required
            />
            {errors.registrationNumber && (
              <p className="text-sm text-destructive">{errors.registrationNumber}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Textarea
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => handleChange('businessAddress', e.target.value)}
            placeholder="123 Business Park, Sector 5, City, State - PIN"
            rows={3}
            required
          />
          {errors.businessAddress && (
            <p className="text-sm text-destructive">{errors.businessAddress}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPersonName">Contact Person Name *</Label>
            <Input
              id="contactPersonName"
              value={formData.contactPersonName}
              onChange={(e) => handleChange('contactPersonName', e.target.value)}
              placeholder="John Doe"
              required
            />
            {errors.contactPersonName && (
              <p className="text-sm text-destructive">{errors.contactPersonName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="+919876543210"
              required
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
          <Input
            id="websiteUrl"
            value={formData.websiteUrl}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
            placeholder="https://www.yourcompany.com"
          />
          {errors.websiteUrl && (
            <p className="text-sm text-destructive">{errors.websiteUrl}</p>
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
              Submitting...
            </span>
          ) : (
            'Submit Registration'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default CompanyStep;
