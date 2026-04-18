import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import {
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Logo from "@/assets/door2fy-logo.png";
import image from '@/assets/logo.png'

const Index = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <header className="p-4 flex justify-between items-center">
        <img src={Logo} alt="Door2Fy Logo" className="h-10 w-auto sm:h-20" />
      </header>

      <main className="container mx-auto px-4 py-12 lg:py-2">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Building2 className="w-4 h-4" />
            Vendor Onboarding Portal
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Partner with
            <span className="inline-flex items-center gap-2 text-primary">
              <img
                src={image}
                alt="Door2Fy Logo"
                className="h-[1em] w-auto align-bottom pt-3"
              />
            </span>
            <br />
            Grow Your Business
          </h1>

          <p
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Join our network of trusted vendors and reach millions of customers.
            Register today and start selling on India's fastest growing delivery
            platform.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link to="/register">
              <Button variant="hero" size="xl">
                Register as Vendor
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl">
                Vendor Login
              </Button>
            </Link>
          </div>
        </div>
        

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div
            className="bg-card rounded-2xl p-6 shadow-card border border-border animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Secure Registration
            </h3>
            <p className="text-muted-foreground">
              Email verification with OTP ensures only genuine businesses join
              our platform.
            </p>
          </div>

          <div
            className="bg-card rounded-2xl p-6 shadow-card border border-border animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Quick Approval
            </h3>
            <p className="text-muted-foreground">
              Our team reviews applications within 2-3 business days for a fast
              onboarding experience.
            </p>
          </div>

          <div
            className="bg-card rounded-2xl p-6 shadow-card border border-border animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Status Tracking
            </h3>
            <p className="text-muted-foreground">
              Track your application status in real-time and get notified upon
              approval.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Trusted by vendors across India
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="font-display font-bold text-2xl text-muted-foreground">
              MicroWorld
            </div>
            <div className="font-display font-bold text-2xl text-muted-foreground">
              LRS service
            </div>
            <div className="font-display font-bold text-2xl text-muted-foreground">
              CMS IT Service
            </div>
            <div className="font-display font-bold text-2xl text-muted-foreground">
              Computer junction
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border mt-12">
        © 2026 Door2Fy. All rights reserved. | Privacy Policy | Terms of Service
      </footer>
    </div>
  );
};

export default Index;
