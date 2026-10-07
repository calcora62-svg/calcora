import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlanStore } from '../store/usePlanStore';
import { safeStorage } from '../utils/storage';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const PremiumHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activatePremiumFromToken } = usePlanStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const token = searchParams.get('token');
    const urlEmail = searchParams.get('email');

    if (!token) {
      setStatus('error');
      setMessage('No payment token found. Please contact support.');
      return;
    }

    // Email verification
    if (!urlEmail) {
      setStatus('error');
      setMessage('Email verification failed. Please contact support.');
      return;
    }

    // Get stored checkout email (set during checkout)
    const storedEmail = safeStorage.getItem('calcora_checkout_email');

    if (!storedEmail) {
      setStatus('error');
      setMessage('This payment link was opened in a different browser. Please use the browser you used to make the payment, or contact support.');
      return;
    }

    if (storedEmail.toLowerCase() !== urlEmail.toLowerCase()) {
      setStatus('error');
      setMessage('This payment link belongs to a different account. Sharing is not allowed.');
      return;
    }

    // Email matched — activate premium
    const success = activatePremiumFromToken(token);

    if (success) {
      setStatus('success');
      setMessage('Premium activated successfully! 🎉');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setStatus('error');
      setMessage('Something went wrong. Please contact support.');
    }
  }, [searchParams, activatePremiumFromToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted-bg/5">
      <div className="max-w-md w-full bg-card border border-border-color rounded-3xl p-8 text-center space-y-6 shadow-lg">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Activating Premium...</h1>
            <p className="text-muted-fg text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Premium! 🎉</h1>
            <p className="text-muted-fg text-sm">{message}</p>
            <div className="bg-primary-50 dark:bg-primary-950/20 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs text-foreground font-semibold">Your Premium benefits:</p>
              <ul className="text-xs text-muted-fg space-y-1">
                <li>✅ 500 uses/day (instead of 5)</li>
                <li>✅ Larger file sizes (up to 1GB)</li>
                <li>✅ Larger photo batches (up to 100 images)</li>
                <li>✅ Longer video exports</li>
                <li>✅ No ads</li>
              </ul>
            </div>
            <Button variant="primary" className="w-full" onClick={() => navigate('/')}>
              Start Using Premium
            </Button>
            <p className="text-xs text-muted-fg">Redirecting in 3 seconds...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Activation Failed</h1>
            <p className="text-muted-fg text-sm">{message}</p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" className="w-full" onClick={() => navigate('/contact')}>
                Contact Support
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Go to Homepage
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};