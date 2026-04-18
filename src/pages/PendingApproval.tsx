import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import { useVendor } from '@/contexts/VendorContext';
import { Clock, Building2, Mail, Phone, MapPin, CheckCircle2, ShieldEllipsis, Star } from 'lucide-react';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { currentVendor, isVerified, logout } = useVendor();

  useEffect(() => {
    if (currentVendor?.status === 'approved') {
      navigate('/dashboard');
    }
  }, [currentVendor, navigate]);

  if (!currentVendor) return null;

  const steps = [
    { label: 'Application Submitted', completed: true, icon: CheckCircle2 },
    { label: 'Identity Verification', completed: true, icon: ShieldEllipsis },
    { label: 'Admin Review', completed: false, icon: Clock },
    { label: 'Portal Access', completed: false, icon: Star },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Logo />
        <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground">
          Sign Out
        </Button>
      </header>

      <main className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <div className="bg-card/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-8 md:p-12 animate-slide-up relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center mb-10">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center shadow-inner">
                <Clock className="w-12 h-12 text-warning animate-pulse" />
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground mb-3 tracking-tight">
                Registration Under Review
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-6">
                Your application has been received and is currently being processed by our compliance team.
              </p>
              <div className="inline-block px-6 py-2 rounded-full bg-warning/10 border border-warning/20">
                <StatusBadge status="pending" size="lg" className="border-none bg-transparent h-auto p-0" />
              </div>
            </div>

            {/* Status Steps Tracker */}
            <div className="mb-12">
              <div className="relative flex justify-between">
                {/* Connection Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-0" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-1000 ease-in-out -z-0" 
                  style={{ width: '50%' }}
                />
                
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-card transition-colors duration-500 ${
                      step.completed ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                    }`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] md:text-xs font-semibold mt-2 uppercase tracking-wider ${
                      step.completed ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 border-t border-border/50 pt-10">
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Profile
                </h2>

                <div className="space-y-5">
                  <div className="p-5 bg-muted/50 rounded-2xl border border-white/5 hover:bg-muted transition-colors">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Company Entity</p>
                    <p className="font-display text-lg font-semibold text-foreground">{currentVendor.companyName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                       <span className="text-xs font-medium px-2 py-1 bg-background/50 rounded-md border border-border">GST: {currentVendor.gstNumber}</span>
                       <span className="text-xs font-medium px-2 py-1 bg-background/50 rounded-md border border-border">Reg: {currentVendor.registrationNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/40">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Business Address</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{currentVendor.businessAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Point of Contact
                </h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Name</p>
                      <p className="font-medium text-foreground">{currentVendor.contactPersonName}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/40">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Direct Email</p>
                    <p className="text-sm font-medium text-foreground">{currentVendor.email}</p>
                    <p className="text-sm text-foreground/60">{currentVendor.phoneNumber}</p>
                  </div>

                  <div className="mt-6 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                      <strong>Next Steps:</strong> We are currently validating your documentation. You'll receive a confirmation email within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8">
                  View Public Portal
                </Button>
              </Link>
              <Button variant="hero" className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20" onClick={() => window.location.reload()}>
                Refresh Status
              </Button>
            </div>
          </div>
          
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Need to update your details? <a href="mailto:support@door2fy.in" className="text-primary hover:underline font-medium">Contact Support</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PendingApproval;
