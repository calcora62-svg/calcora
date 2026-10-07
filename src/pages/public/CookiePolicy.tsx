import React from 'react';
import { SEO } from '../../components/common/SEO';

export const CookiePolicy = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <SEO 
        title="Cookie Policy - Calcora" 
        description="Read the Calcora cookie policy. Learn how we use cookies and how to manage your preferences."
        path="/cookies"
      />
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Cookie Policy</h1>
        <p className="text-muted-fg text-sm">Last updated: September 30, 2025</p>
        
        <p className="leading-relaxed text-muted-fg">
          This Cookie Policy explains how Calcora uses cookies and similar technologies to recognize you when you visit our website.
        </p>

        <h2 className="text-2xl font-bold text-foreground">1. What Are Cookies?</h2>
        <p className="leading-relaxed text-muted-fg">
          Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.
        </p>

        <h2 className="text-2xl font-bold text-foreground">2. How We Use Cookies</h2>
        <p className="leading-relaxed text-muted-fg">
          Calcora uses minimal cookies for the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-fg pl-4">
          <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., theme preference, premium status)</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our tools (only with your consent)</li>
          <li><strong>Preference Cookies:</strong> Remember your settings (e.g., dark mode, last used tool)</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">3. Third-Party Cookies</h2>
        <p className="leading-relaxed text-muted-fg">
          We may use third-party services that set their own cookies:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-fg pl-4">
          <li><strong>Google Analytics:</strong> Anonymous usage statistics (opt-in only)</li>
          <li><strong>LemonSqueezy:</strong> Payment processing (on checkout pages only)</li>
          <li><strong>Google AdSense:</strong> Advertising for free users (if applicable)</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">4. Your Cookie Choices</h2>
        <p className="leading-relaxed text-muted-fg">
          When you first visit Calcora, you will see a consent banner. You can:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-fg pl-4">
          <li><strong>Accept:</strong> Allow all cookies including analytics</li>
          <li><strong>Decline:</strong> Only essential cookies will be used</li>
          <li><strong>Change anytime:</strong> Clear browser cookies to see the banner again</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">5. Managing Cookies</h2>
        <p className="leading-relaxed text-muted-fg">
          You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may affect website functionality.
        </p>

        <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
        <p className="leading-relaxed text-muted-fg">
          If you have questions about our Cookie Policy, contact us at <strong>calcora62@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
};