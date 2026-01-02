import { ReactNode } from 'react';
import Logo from './Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <header className="p-4 sm:p-6">
        <Logo />
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8 sm:pb-12">
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
      </main>
      
      <footer className="p-4 sm:p-6 text-center text-xs sm:text-sm text-muted-foreground">
        © 2024 Door2Fy. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
