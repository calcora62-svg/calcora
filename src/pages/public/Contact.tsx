import React from 'react';
import { SEO } from '../../components/common/SEO';
import { Mail, MessageSquare, Clock } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <SEO 
        title="Contact Us - Calcora" 
        description="Get in touch with the Calcora team. Send your questions, feedback, or feature requests."
        path="/contact"
      />
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Contact Calcora</h1>
        <p className="text-lg text-muted-fg">
          Have feedback, feature requests, or questions? We'd love to hear from you.
        </p>
      </div>

      <div className="bg-card border border-border-color rounded-3xl p-8 shadow-sm space-y-8">
        {/* Email Option */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Email Us</h2>
          <p className="text-muted-fg max-w-md mx-auto">
            The fastest way to reach us is by email. Click the button below to open your email app.
          </p>
          <a 
            href="mailto:calcora62@gmail.com?subject=Calcora%20Inquiry"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Mail className="w-5 h-5" />
            calcora62@gmail.com
          </a>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-color">
          <div className="flex items-start gap-3 p-4 bg-muted-bg/50 rounded-xl">
            <MessageSquare className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Feedback & Features</h3>
              <p className="text-xs text-muted-fg leading-relaxed">
                Tell us what you'd like to see next in Calcora.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-muted-bg/50 rounded-xl">
            <Clock className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Response Time</h3>
              <p className="text-xs text-muted-fg leading-relaxed">
                We aim to reply within 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note about form */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-center">
        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
          A contact form will be available soon. For now, please use email.
        </p>
      </div>
    </div>
  );
};