import React, { useEffect } from 'react';
import { usePlanStore } from '../../store/usePlanStore';
import { safeStorage } from '../../utils/storage';

// Reusable responsive ad container that prevents layout shifts
// NOTE: VITE_ADSENSE_CLIENT_ID must be set in .env to activate real AdSense ads.
interface AdSlotProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  slot?: string;
}

const useAdStatus = () => {
  const adsenseId = (import.meta as any).env.VITE_ADSENSE_CLIENT_ID;
  const isAdConfigured = !!adsenseId;
  const { activePlan } = usePlanStore();
  const plan = activePlan;
  
  const hasDeclinedConsent = safeStorage.getItem('calcora-analytics-consent') === 'declined';

  const shouldShowAds = isAdConfigured && plan === 'free' && !hasDeclinedConsent;

  useEffect(() => {
    if (shouldShowAds && typeof window !== 'undefined') {
      if (!document.getElementById('adsbygoogle-script')) {
        const script = document.createElement('script');
        script.id = 'adsbygoogle-script';
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense push error:', e);
      }
    }
  }, [shouldShowAds, adsenseId]);

  return { shouldShowAds, adsenseId };
};

export const TopAdSlot: React.FC<AdSlotProps> = ({ id, className = '', style, slot }) => {
  const { shouldShowAds, adsenseId } = useAdStatus();

  return (
    <div 
      id={id}
      className={`mx-auto w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      style={{
        minHeight: '90px',
        maxHeight: '100px',
        maxWidth: '728px',
        margin: '1.5rem auto',
        ...style
      }}
    >
      {!shouldShowAds ? (
        // Completely empty placeholder layout block to prevent CLS without visual noise
        <div className="w-full h-full" aria-hidden="true" />
      ) : (
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={adsenseId}
          data-ad-slot={slot || "1234567890"}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};

export const ToolAdSlot: React.FC<AdSlotProps> = ({ id, className = '', style, slot }) => {
  const { shouldShowAds, adsenseId } = useAdStatus();

  return (
    <div 
      id={id}
      className={`mx-auto w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      style={{
        minHeight: '250px',
        maxHeight: '300px',
        maxWidth: '336px',
        margin: '2rem auto',
        ...style
      }}
    >
      {!shouldShowAds ? (
        <div className="w-full h-full" aria-hidden="true" />
      ) : (
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={adsenseId}
          data-ad-slot={slot || "0987654321"}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};

export const BottomAdSlot: React.FC<AdSlotProps> = ({ id, className = '', style, slot }) => {
  const { shouldShowAds, adsenseId } = useAdStatus();

  return (
    <div 
      id={id}
      className={`mx-auto w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`}
      style={{
        minHeight: '90px',
        maxHeight: '100px',
        maxWidth: '970px',
        margin: '2.5rem auto',
        ...style
      }}
    >
      {!shouldShowAds ? (
        <div className="w-full h-full" aria-hidden="true" />
      ) : (
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={adsenseId}
          data-ad-slot={slot || "1122334455"}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};
