import { ReactNode } from 'react';
import Logo from './Logo';
import vendorIllustration from '@/assets/vendor-registration-illustration.png';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <header className="p-4 sm:p-6 lg:hidden">
        <Logo />
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8 sm:pb-12 lg:px-0 lg:pb-0">
        <div className="w-full lg:flex lg:min-h-screen">
          {/* Left Side - Illustration (Desktop Only) */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 items-center justify-center p-12 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            </div>
            
            <div className="relative z-10 text-center max-w-lg">
              <div className="mb-8">
                <Logo />
              </div>
              
              <img 
                src={vendorIllustration} 
                alt="Vendor Registration Illustration" 
                className="w-full max-w-md mx-auto mb-8 drop-shadow-xl rounded-2xl"
              />
              
              <h2 className="font-display text-2xl xl:text-3xl font-bold text-foreground mb-4">
                Partner with <span className="text-primary">Door2Fy</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Join our network of trusted service partners and grow your business with us.
              </p>
              
              {/* Feature highlights */}
              <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Easy Onboarding</h3>
                  <p className="text-sm text-muted-foreground">Quick and simple registration process</p>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Grow Revenue</h3>
                  <p className="text-sm text-muted-foreground">Access more customers daily</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center lg:p-12">
            <div className="w-full max-w-md">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              
              <div className="bg-card rounded-xl sm:rounded-2xl shadow-card p-6 sm:p-8 animate-scale-in">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-4 sm:p-6 text-center text-xs sm:text-sm text-muted-foreground lg:absolute lg:bottom-0 lg:right-0 lg:w-1/2">
        © 2024 Door2Fy. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
