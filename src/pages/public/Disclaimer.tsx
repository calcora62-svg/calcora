import React from 'react';
import { SEO } from '../../components/common/SEO';

export const Disclaimer = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <SEO 
        title="Disclaimer - Calcora" 
        description="Read the Calcora disclaimer. Important information about tool usage, limitations, and liability."
        path="/disclaimer"
      />
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Disclaimer</h1>
        <p className="text-muted-fg text-sm">Last updated: September 30, 2025</p>
        
        <p className="leading-relaxed text-muted-fg">
          The information and tools provided by Calcora are for general use. Please read this disclaimer carefully before using our website.
        </p>

        <h2 className="text-2xl font-bold text-foreground">1. Tool Accuracy</h2>
        <p className="leading-relaxed text-muted-fg">
          While we strive to provide accurate and reliable tools, Calcora makes no warranties about the completeness, reliability, or accuracy of the results. Any action you take based on the output of our tools is strictly at your own risk.
        </p>

        <h2 className="text-2xl font-bold text-foreground">2. File Processing</h2>
        <p className="leading-relaxed text-muted-fg">
          All files are processed locally in your browser whenever technically possible. We do not upload, store, or access your files on our servers. However, we recommend keeping backups of important files before processing.
        </p>

        <h2 className="text-2xl font-bold text-foreground">3. Video and Audio Tools (Beta)</h2>
        <p className="leading-relaxed text-muted-fg">
          Video and audio tools marked as "Beta" use browser-based WebAssembly technology. Results may vary depending on your device, browser, and internet speed. Some features may not work on older devices or browsers.
        </p>

        <h2 className="text-2xl font-bold text-foreground">4. No Professional Advice</h2>
        <p className="leading-relaxed text-muted-fg">
          Calcora tools are not a substitute for professional advice. For legal, financial, medical, or business decisions, please consult a qualified professional.
        </p>

        <h2 className="text-2xl font-bold text-foreground">5. External Links</h2>
        <p className="leading-relaxed text-muted-fg">
          Our website may contain links to external websites. We are not responsible for the content, privacy policies, or practices of any third-party sites.
        </p>

        <h2 className="text-2xl font-bold text-foreground">6. Limitation of Liability</h2>
        <p className="leading-relaxed text-muted-fg">
          Calcora shall not be liable for any loss or damage arising from the use of our website or tools. This includes, but is not limited to, data loss, business interruption, or any indirect or consequential damages.
        </p>

        <h2 className="text-2xl font-bold text-foreground">7. Changes to This Disclaimer</h2>
        <p className="leading-relaxed text-muted-fg">
          We may update this disclaimer from time to time. Changes will be posted on this page with an updated date.
        </p>

        <h2 className="text-2xl font-bold text-foreground">8. Contact Us</h2>
        <p className="leading-relaxed text-muted-fg">
          If you have any questions about this disclaimer, please contact us at <strong>calcora62@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
};