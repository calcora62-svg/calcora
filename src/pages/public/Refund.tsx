import React from 'react';
import { SEO } from '../../components/common/SEO';

export const Refund = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <SEO 
        title="Refund Policy - Calcora" 
        description="Read the Calcora refund policy. 7-day money-back guarantee on all Premium subscriptions."
        path="/refund"
      />
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Refund Policy</h1>
        <p className="text-muted-fg text-sm">Last updated: September 30, 2025</p>
        
        <p className="leading-relaxed text-muted-fg">
          At Calcora, we want you to be completely satisfied with your Premium subscription. If you are not satisfied for any reason, we offer a <strong>7-day money-back guarantee</strong>.
        </p>

        <h2 className="text-2xl font-bold text-foreground">1. 7-Day Money-Back Guarantee</h2>
        <p className="leading-relaxed text-muted-fg">
          You can request a full refund within <strong>7 days</strong> of your initial purchase. No questions asked.
        </p>

        <h2 className="text-2xl font-bold text-foreground">2. How to Request a Refund</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-fg pl-4">
          <li>Email us at <strong>calcora62@gmail.com</strong> with your order details</li>
          <li>Include your name, email, and purchase date</li>
          <li>We will process your refund within <strong>3-5 business days</strong></li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground">3. Refund Eligibility</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-fg pl-4">
          <li>Request must be made within 7 days of purchase</li>
          <li>Only one refund per customer</li>
          <li>Subscription must not be renewed after refund</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">4. Subscription Cancellation</h2>
        <p className="leading-relaxed text-muted-fg">
          You can cancel your subscription at any time. After cancellation, you will continue to have Premium access until the end of your current billing period. No further charges will be applied.
        </p>

        <h2 className="text-2xl font-bold text-foreground">5. Contact Us</h2>
        <p className="leading-relaxed text-muted-fg">
          If you have any questions about our refund policy, please contact us at <strong>calcora62@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
};