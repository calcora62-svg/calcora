import React from 'react';
import { SEO } from '../../components/common/SEO';

export const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <SEO 
        title="Privacy Policy - Calcora" 
        description="Read the Calcora privacy policy. Learn about local browser file processing, data security, and compliance."
        path="/privacy"
      />
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted-fg text-sm">Last updated: September 18, 2026</p>
        
        <p className="leading-relaxed text-muted-fg">
          At Calcora, accessible from calcora.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Calcora and how we use it.
        </p>

        <h2 className="text-2xl font-bold text-foreground">1. Browser-Based Local Processing Promise</h2>
        <p className="leading-relaxed text-muted-fg">
          At Calcora, your privacy is our core architecture, not an afterthought. <strong>Your files are processed locally in your browser and are not uploaded to Calcora or any third-party server.</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-fg pl-4">
          <li><strong>Zero Uploads:</strong> Your documents, images, PDFs, videos, and spreadsheets never leave your device. All calculations, conversions, and edits happen directly in your browser using modern client-side WebAssembly, Canvas, and JavaScript engines.</li>
          <li><strong>No Server Storage:</strong> Because files never reach our servers, we cannot see, store, log, analyze, or leak your private content.</li>
          <li><strong>Immediate Security:</strong> When you close your browser tab or click Reset, all file data held in your browser's temporary memory is immediately discarded.</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">2. Server-Dependent Tools Policy</h2>
        <p className="leading-relaxed text-muted-fg">
          Tools that fundamentally require server infrastructure (such as proprietary Microsoft Office format transformations) are clearly marked as <strong>Coming Soon</strong>. These tools do not permit file uploads or data collection until end-to-end zero-knowledge server sandboxing is deployed.
        </p>

        <h2 className="text-2xl font-bold text-foreground">3. Information We Collect</h2>
        <p className="leading-relaxed text-muted-fg">
          If you contact us directly, we may receive additional information about you such as your name, email address, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
        </p>

        <h2 className="text-2xl font-bold text-foreground">4. Analytics & Cookie Policy</h2>
        <p className="leading-relaxed text-muted-fg">
          If configured by administration and approved, we use Google Analytics 4 to track anonymized usage metrics (such as pages visited and tool utilization rate). 
          <strong>We never send files, file contents, passwords, API keys, or personal identifying names inside filenames to our analytics server.</strong> 
          You can disable cookies or use browser tracking blockers to opt-out.
        </p>

        <h2 className="text-2xl font-bold text-foreground">5. Security</h2>
        <p className="leading-relaxed text-muted-fg">
          We use commercially acceptable protective measures to secure your personal info. However, no transmission method over the internet or system of electronic storage is 100% secure.
        </p>

        <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
        <p className="leading-relaxed text-muted-fg">
          If you have any questions about this Privacy Policy, do not hesitate to contact us at calcora62@gmail.com.
        </p>
      </div>
    </div>
  );
};