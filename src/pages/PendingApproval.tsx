import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import { useVendor } from '@/contexts/VendorContext';
import { Clock, Building2, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { currentVendor, isVerified } = useVendor();

  useEffect(() => {
    if (!isVerified || !currentVendor) {
      navigate('/register');
    }
  }, [isVerified, currentVendor, navigate]);

  if (!currentVendor) return null;

  return (
    <div className="min-h-screen gradient-hero">
      <header className="p-6 flex justify-between items-center">
        <Logo />
        <Link to="/admin">
          <Button variant="outline" size="sm">
            Admin Panel
          </Button>
        </Link>
      </header>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-2xl shadow-card p-8 animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-10 h-10 text-warning" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Registration Submitted
              </h1>
              <p className="text-muted-foreground mb-4">
                Your vendor application is currently under review
              </p>
              <StatusBadge status={currentVendor.status} size="lg" />
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <h2 className="font-display font-semibold text-lg text-foreground">
                Submitted Details
              </h2>

              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{currentVendor.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      GST: {currentVendor.gstNumber} | Reg: {currentVendor.registrationNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Business Address</p>
                    <p className="text-sm text-muted-foreground">{currentVendor.businessAddress}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{currentVendor.contactPersonName}</p>
                      <p className="text-sm text-muted-foreground">{currentVendor.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <p className="text-sm text-muted-foreground">{currentVendor.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                {currentVendor.websiteUrl && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Website</p>
                      <a
                        href={currentVendor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {currentVendor.websiteUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 bg-accent rounded-lg">
              <p className="text-sm text-accent-foreground">
                <strong>What happens next?</strong> Our team will review your application within 2-3 business days. 
                You'll receive an email notification once your account has been approved or if we need additional information.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link to="/">
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PendingApproval;
