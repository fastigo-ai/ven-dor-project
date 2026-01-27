import { ReactNode } from "react";
import Logo from "./Logo";
import vendorIllustration from "@/assets/vendor-registration-illustration.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* HEADER (Logo always on top) */}
      {/* HEADER (Logo on top, not full width) */}
      <header className="w-full border-b border-border/40 bg-background/70 backdrop-blur">
        <div className="w-24 px-4 sm:px-2 py-2">
          <Logo />
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT SECTION (Image) */}
        <section className="hidden lg:flex pt-10  justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center max-w-lg px-12">
            <img
              src={vendorIllustration}
              alt="Vendor Registration"
              className="w-full max-w-md mx-auto mb-4 h-2/3 rounded-3xl drop-shadow-xl"
            />

            <h2 className="font-display text-3xl font-bold mb-4">
              Partner with <span className="text-primary">Door2Fy</span>
            </h2>

            <p className="text-muted-foreground text-lg">
              Join our network and grow your business with more customers.
            </p>
          </div>
        </section>

        {/* RIGHT SECTION (Form) */}
        <section className="flex  justify-center px-4 sm:px-6 pt-10 ">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold mb-2">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8 animate-scale-in">
              {children}
            </div>
          </div>
        </section>
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border mt-2">
        © 2026 Door2Fy. All rights reserved. | Privacy Policy | Terms of Service
      </footer>
    </div>
  );
};

export default AuthLayout;
