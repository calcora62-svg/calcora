import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { initGA } from '../../utils/analytics';
import { safeStorage } from '../../utils/storage';

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedConsent = safeStorage.getItem('calcora-analytics-consent');
    const gaId = (import.meta as any).env.VITE_GA_MEASUREMENT_ID;
    
    // Only show banner if there's no stored preference AND a GA measurement ID actually exists
    if (!storedConsent && gaId) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    safeStorage.setItem('calcora-analytics-consent', 'accepted');
    setIsVisible(false);
    initGA(); // Initialize immediately upon consent
  };

  const handleDecline = () => {
    safeStorage.setItem('calcora-analytics-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-card border border-border-color p-5 rounded-2xl shadow-xl z-50 animate-fade-in-up">
      <div className="flex gap-4 items-start">
        <div className="p-2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-foreground text-sm">Privacy & Analytics Consent</h4>
            <button 
              onClick={handleDecline} 
              className="text-muted-fg hover:text-foreground transition-colors p-1"
              aria-label="Close consent banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-muted-fg text-xs leading-relaxed mb-4">
            We use anonymous analytics to understand tool usage and improve Calcora. We <strong>never</strong> collect your files, filenames, file contents, or credentials. Do you agree to basic, anonymous analytics?
          </p>
          <div className="flex items-center gap-3 justify-end text-xs font-medium">
            <button 
              onClick={handleDecline}
              className="px-3 py-1.5 rounded-lg border border-border-color text-muted-fg hover:bg-muted-bg hover:text-foreground transition-colors"
            >
              No, Thanks
            </button>
            <button 
              onClick={handleAccept}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Yes, I Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
