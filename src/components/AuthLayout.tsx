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
      <header className="p-6">
        <Logo />
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="bg-card rounded-2xl shadow-card p-8 animate-scale-in">
            {children}
          </div>
        </div>
      </main>
      
      <footer className="p-6 text-center text-sm text-muted-foreground">
        © 2024 Door2Fy. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
