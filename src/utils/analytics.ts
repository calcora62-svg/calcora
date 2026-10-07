import { safeStorage } from './storage';

const GA_ID = (import.meta as any).env.VITE_GA_MEASUREMENT_ID;

/**
 * Helper to check if user has given consent to analytics tracking.
 */
export const hasConsent = (): boolean => {
  return safeStorage.getItem('calcora-analytics-consent') === 'accepted';
};

/**
 * Initializes Google Analytics 4 dynamically if a Measurement ID is configured and consent is accepted.
 */
export const initGA = () => {
  if (!GA_ID) return;
  if (typeof window === 'undefined') return;
  if (!hasConsent()) return; // Prevent loading tracking libraries before consent is given
  if ((window as any).gtag) return; // Prevent double initialization

  try {
    // Inject gtag script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Inject configuration script
    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { 'send_page_view': false });
    `;
    document.head.appendChild(configScript);
    console.log(`[Calcora Analytics] Google Analytics 4 initialized with ID: ${GA_ID}`);
  } catch (err) {
    console.warn('[Calcora Analytics] Failed to initialize Google Analytics:', err);
  }
};

/**
 * Tracks a page view event.
 */
export const trackPageView = (path: string, title?: string) => {
  if (!GA_ID || typeof window === 'undefined' || !hasConsent() || !(window as any).gtag) return;

  try {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  } catch (err) {
    console.warn('[Calcora Analytics] Page view tracking error:', err);
  }
};

/**
 * Safely tracks a custom event with sanitized event parameters (excluding sensitive details/filenames).
 */
export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (!GA_ID || typeof window === 'undefined' || !hasConsent() || !(window as any).gtag) return;

  try {
    const sanitizedParams = { ...params };
    
    // Privacy protection: strip individual file names and full file paths
    if (sanitizedParams.fileName || sanitizedParams.filename) {
      const name = sanitizedParams.fileName || sanitizedParams.filename;
      sanitizedParams.file_extension = name.split('.').pop()?.toLowerCase() || 'unknown';
      delete sanitizedParams.fileName;
      delete sanitizedParams.filename;
    }

    // Strip key patterns
    delete sanitizedParams.apiKey;
    delete sanitizedParams.api_key;
    delete sanitizedParams.token;
    delete sanitizedParams.password;

    (window as any).gtag('event', eventName, sanitizedParams);
  } catch (err) {
    console.warn(`[Calcora Analytics] Event tracking error for ${eventName}:`, err);
  }
};
