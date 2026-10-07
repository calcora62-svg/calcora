import React, { useState } from 'react';
import { PRICING_PLANS, PlanId } from '../config/pricing';
import { usePlanStore } from '../store/usePlanStore';
import { safeStorage } from '../utils/storage';
import { Check, Shield, CreditCard, Sparkles, Mail, Clock, CheckCircle2 } from 'lucide-react';

export const PricingPage = () => {
  const { activePlan, setActivePlan, getUsageCount } = usePlanStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === 'free') {
      setActivePlan('free');
      return;
    }
    setShowWaitlistModal(true);
    setWaitlistSubmitted(false);
    setWaitlistError('');
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }

    const email = waitlistEmail.trim().toLowerCase();

    try {
      safeStorage.setItem('calcora_checkout_email', email);

      const stored = safeStorage.getItem('calcora_premium_waitlist');
      const list = stored ? JSON.parse(stored) : [];
      if (!list.includes(email)) {
        list.push(email);
        safeStorage.setItem('calcora_premium_waitlist', JSON.stringify(list));
      }
    } catch {
      // safe fallback
    }

    setWaitlistSubmitted(true);
    setWaitlistError('');
  };

  const currentUsage = getUsageCount();

  // Price config for each billing cycle
  const priceConfig = {
    monthly: { original: '$9.99', current: '$4.99', period: '/month' },
    yearly: { original: '$99.99', current: '$49', period: '/year' },
    lifetime: { original: '$199', current: '$99', period: 'one-time' },
  };

  return (
    <div className="py-8 md:py-16 px-4 md:px-6 animate-fade-in max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
        <span 
          style={{ backgroundColor: '#0f3c7c' }}
          className="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
        >
          Pricing Plans
        </span>
        <h1 className="text-2xl md:text-5xl font-black mt-4 mb-3 md:mb-4 tracking-tight font-display">
          Fast, private tools with transparent pricing
        </h1>
        <p className="text-sm md:text-base text-muted-fg max-w-xl mx-auto">
          Process your spreadsheets, resize photos, and make social videos completely locally. Choose the plan that matches your volume.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 md:mt-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-xl border transition-all ${
              billingCycle === 'monthly'
                ? 'bg-foreground border-foreground text-background shadow-sm'
                : 'bg-card border-border-color text-muted-fg hover:text-foreground'
            }`}
          >
            Monthly ($4.99/mo)
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-foreground border-foreground text-background shadow-sm'
                : 'bg-card border-border-color text-muted-fg hover:text-foreground'
            }`}
          >
            Yearly ($49/yr)
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] md:text-[10px] py-0.5 px-1.5 rounded-full font-extrabold uppercase">
              Save 18%
            </span>
          </button>
          <button
            onClick={() => setBillingCycle('lifetime')}
            className={`px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              billingCycle === 'lifetime'
                ? 'bg-foreground border-foreground text-background shadow-sm'
                : 'bg-card border-border-color text-muted-fg hover:text-foreground'
            }`}
          >
            Lifetime ($99)
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] md:text-[10px] py-0.5 px-1.5 rounded-full font-extrabold uppercase">
              Best Deal
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-4xl mx-auto mb-10 md:mb-16">
        {/* Free Plan */}
        <div className={`p-5 md:p-8 rounded-2xl bg-card border transition-all flex flex-col justify-between ${
          activePlan === 'free' ? 'border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-border-color'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold font-display">{PRICING_PLANS.free.name}</h3>
                <p className="text-[11px] md:text-xs text-muted-fg mt-1">{PRICING_PLANS.free.subtitle}</p>
              </div>
              {activePlan === 'free' && (
                <span className="bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-400 text-[9px] md:text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            <div className="mb-4 md:mb-6">
              <span className="text-2xl md:text-3xl font-extrabold">$0</span>
              <span className="text-[11px] md:text-xs text-muted-fg"> / forever</span>
            </div>

            <ul className="space-y-2.5 md:space-y-3.5 mb-6 md:mb-8">
              {PRICING_PLANS.free.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] md:text-xs">
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('free')}
            disabled={activePlan === 'free'}
            className={`w-full py-2 md:py-2.5 px-3 md:px-4 text-[11px] md:text-xs font-bold rounded-xl border transition-all ${
              activePlan === 'free'
                ? 'bg-muted-bg border-transparent text-muted-fg cursor-not-allowed'
                : 'bg-foreground border-foreground text-background hover:bg-opacity-90'
            }`}
          >
            {activePlan === 'free' ? 'Default Plan Active' : 'Switch to Free Plan'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className={`p-5 md:p-8 rounded-2xl bg-card border transition-all flex flex-col justify-between relative ${
          activePlan === 'premium' ? 'border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-border-color hover:border-primary-400'
        }`}>
          <div className="absolute -top-3 right-4 md:right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] md:text-[10px] font-black px-2.5 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-wider shadow-sm">
            Launch Special
          </div>

          <div>
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold font-display">{PRICING_PLANS.premium.name}</h3>
                <p className="text-[11px] md:text-xs text-muted-fg mt-1">{PRICING_PLANS.premium.subtitle}</p>
              </div>
              {activePlan === 'premium' && (
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] md:text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            {/* Price display with strikethrough original price */}
            <div className="mb-4 md:mb-6 flex flex-col">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg md:text-xl text-muted-fg line-through font-bold">
                  {priceConfig[billingCycle].original}
                </span>
                <span className="text-2xl md:text-3xl font-extrabold text-foreground">
                  {priceConfig[billingCycle].current}
                </span>
                <span className="text-[11px] md:text-xs text-muted-fg">
                  {priceConfig[billingCycle].period}
                </span>
              </div>
              <span className="text-[10px] md:text-[10px] text-amber-600 font-bold mt-1">
                ⚠️ Launch pricing ends soon. Regular price: {priceConfig[billingCycle].original}
              </span>
            </div>

            <ul className="space-y-2.5 md:space-y-3.5 mb-6 md:mb-8">
              {PRICING_PLANS.premium.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] md:text-xs">
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('premium')}
            className={`w-full py-2 md:py-2.5 px-3 md:px-4 text-[11px] md:text-xs font-bold rounded-xl transition-all ${
              activePlan === 'premium'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-primary border border-primary hover:bg-primary-600 text-white shadow-sm'
            }`}
          >
            {activePlan === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto overflow-x-auto border border-border-color rounded-2xl bg-card mb-10 md:mb-16">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border-color bg-muted-bg/30">
              <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-fg">Feature</th>
              <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-fg text-center w-28 md:w-40">Free</th>
              <th className="p-3 md:p-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-fg text-center w-28 md:w-40 text-primary-600">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color text-[11px] md:text-xs">
            <tr>
              <td className="p-3 md:p-4 font-medium text-foreground">Daily tool usage</td>
              <td className="p-3 md:p-4 text-center text-muted-fg">5 uses / day</td>
              <td className="p-3 md:p-4 text-center font-bold text-primary-600">Higher limits</td>
            </tr>
            <tr>
              <td className="p-3 md:p-4 font-medium text-foreground">Excel / CSV Cleaner</td>
              <td className="p-3 md:p-4 text-center text-muted-fg">Basic cleaning</td>
              <td className="p-3 md:p-4 text-center font-bold text-foreground">Advanced + larger</td>
            </tr>
            <tr>
              <td className="p-3 md:p-4 font-medium text-foreground">Product Photo Batch</td>
              <td className="p-3 md:p-4 text-center text-muted-fg">Max 5 images</td>
              <td className="p-3 md:p-4 text-center font-bold text-foreground">Max 100 images</td>
            </tr>
            <tr>
              <td className="p-3 md:p-4 font-medium text-foreground">Social Video Maker</td>
              <td className="p-3 md:p-4 text-center text-muted-fg">Basic exports</td>
              <td className="p-3 md:p-4 text-center font-bold text-foreground">Longer + higher quality</td>
            </tr>
            <tr>
              <td className="p-3 md:p-4 font-medium text-foreground">Watermark</td>
              <td className="p-3 md:p-4 text-center text-muted-fg">None</td>
              <td className="p-3 md:p-4 text-center font-bold text-foreground">None</td>
            </tr>
            <tr>
              <td className="p-3 md:p-4 font-medium text-foreground">Ads</td>
              <td className="p-3 md:p-4 text-center text-muted-fg">Standard</td>
              <td className="p-3 md:p-4 text-center font-bold text-foreground">No ads</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto text-center border-t border-border-color pt-8 md:pt-12">
        <div className="flex flex-col items-center">
          <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary-600 mb-2" />
          <h4 className="text-xs md:text-sm font-bold mb-1">100% Privacy Focused</h4>
          <p className="text-[11px] md:text-xs text-muted-fg max-w-[240px] mx-auto">
            Your files are processed entirely in your web browser.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-primary-600 mb-2" />
          <h4 className="text-xs md:text-sm font-bold mb-1">No Fake Claims</h4>
          <p className="text-[11px] md:text-xs text-muted-fg max-w-[240px] mx-auto">
            Try all features fully before upgrading.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary-600 mb-2" />
          <h4 className="text-xs md:text-sm font-bold mb-1">No Watermarks</h4>
          <p className="text-[11px] md:text-xs text-muted-fg max-w-[240px] mx-auto">
            Enjoy downloads with no intrusive logos.
          </p>
        </div>
      </div>

      {/* Email Capture Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-color rounded-3xl p-5 md:p-8 max-w-md w-full shadow-xl space-y-5 md:space-y-6 animate-fade-in relative">
            <button
              onClick={() => setShowWaitlistModal(false)}
              className="absolute top-4 right-4 md:top-5 md:right-5 text-muted-fg hover:text-foreground text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center bg-muted-bg"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="flex items-start gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[9px] md:text-[10px] font-bold uppercase tracking-wide mb-1">
                  Payment Coming Soon
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-foreground font-display">Calcora Premium Launch</h3>
                <p className="text-[11px] md:text-xs text-muted-fg mt-1">
                  Online payments are launching very soon.
                </p>
              </div>
            </div>

            {waitlistSubmitted ? (
              <div className="p-4 md:p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
                <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-xs md:text-sm font-bold text-emerald-900 dark:text-emerald-200">You're on the priority waitlist!</h4>
                <p className="text-[11px] md:text-xs text-emerald-800 dark:text-emerald-300">
                  We'll notify you when Premium launches.
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-900/40 py-1.5 px-2 rounded-lg break-all">
                  {waitlistEmail}
                </p>
                <button
                  onClick={() => setShowWaitlistModal(false)}
                  className="mt-2 w-full py-2 md:py-2.5 px-3 md:px-4 text-[11px] md:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3 md:space-y-4">
                <div className="p-3 md:p-4 bg-muted-bg/50 rounded-2xl border border-border-color text-[11px] md:text-xs text-muted-fg space-y-1.5">
                  <p className="text-foreground font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Enter your email
                  </p>
                  <p>
                    This email will be used to verify your payment.
                  </p>
                </div>

                {waitlistError && (
                  <p className="text-[11px] md:text-xs text-red-600 font-semibold">{waitlistError}</p>
                )}

                <div>
                  <label htmlFor="waitlist-email" className="block text-[11px] md:text-xs font-bold text-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-fg absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="waitlist-email"
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2 md:py-2.5 text-[11px] md:text-xs bg-muted-bg border border-border-color rounded-xl text-foreground placeholder:text-muted-fg focus:outline-none focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 md:pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 md:py-2.5 px-3 md:px-4 text-[11px] md:text-xs font-bold bg-primary hover:bg-primary-600 text-white rounded-xl transition-all shadow-sm"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWaitlistModal(false)}
                    className="py-2 md:py-2.5 px-3 md:px-4 text-[11px] md:text-xs font-bold bg-card hover:bg-muted-bg text-muted-fg hover:text-foreground rounded-xl border border-border-color"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};