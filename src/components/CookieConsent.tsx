import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'false');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50"
        >
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 overflow-hidden relative group">
            {/* Decorative background gradient */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display font-bold text-lg text-foreground tracking-tight">
                    Cookie Settings
                  </h3>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  We use cookies to enhance your experience, analyze site traffic, and ensure secure authentication for our vendor partners.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="default" 
                    onClick={handleAccept}
                    className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20"
                  >
                    Accept All
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDecline}
                    className="rounded-xl px-6 bg-transparent border-white/10 hover:bg-white/5"
                  >
                    Preferences
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Privacy Protected & GDPR Compliant
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
