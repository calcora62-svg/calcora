import React from 'react';
import { SEO } from '../../components/common/SEO';

export const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <SEO 
        title="Terms of Service - Calcora" 
        description="Read the Calcora terms of service and usage conditions."
        path="/terms"
      />
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Terms of Service</h1>
        <p className="text-muted-fg text-sm">Last updated: September 18, 2026</p>
        
        <p className="leading-relaxed text-muted-fg">
          Welcome to Calcora! These terms and conditions outline the rules and regulations for the use of Calcora's Website, located at calcora.com.
        </p>

        <h2 className="text-2xl font-bold text-foreground">1. Terms</h2>
        <p className="leading-relaxed text-muted-fg">
          By accessing this website, we assume you accept these terms and conditions. Do not continue to use Calcora if you do not agree to take all of the terms and conditions stated on this page.
        </p>

        <h2 className="text-2xl font-bold text-foreground">2. Intellectual Property</h2>
        <p className="leading-relaxed text-muted-fg">
          Unless otherwise stated, Calcora and/or its licensors own the intellectual property rights for all material on Calcora. All intellectual property rights are reserved. You may access this from Calcora for your own personal use subjected to restrictions set in these terms and conditions.
        </p>

        <h2 className="text-2xl font-bold text-foreground">3. User Restrictions</h2>
        <p className="leading-relaxed text-muted-fg">
          You are specifically restricted from all of the following:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-fg pl-4">
          <li>Publishing any Calcora material in any other media without prior credit.</li>
          <li>Selling, sublicensing, and/or otherwise commercializing any website material.</li>
          <li>Using this website in any way that is or may be damaging to this website.</li>
          <li>Using this website in any way that impacts user access to this website.</li>
          <li>Using this website contrary to applicable laws and regulations, or in any way may cause harm to the website, or to any person or business entity.</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">4. Limitation of Liability</h2>
        <p className="leading-relaxed text-muted-fg">
          In no event shall Calcora, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website whether such liability is under contract. Calcora, including its officers, directors, and employees shall not be held liable for any indirect, consequential, or special liability arising out of or in any way related to your use of this website.
        </p>

        <h2 className="text-2xl font-bold text-foreground">5. Disclaimer</h2>
        <p className="leading-relaxed text-muted-fg">
          Our website and the tools thereon are provided on an "as-is" and "as-available" basis, with all faults, and Calcora makes no express or implied representations or warranties of any kind related to this website or the materials contained on this website.
        </p>

        <h2 className="text-2xl font-bold text-foreground">6. Variations & Governing Law</h2>
        <p className="leading-relaxed text-muted-fg">
          Calcora is permitted to revise these terms at any time as it sees fit, and by using this website you are expected to review these terms on a regular basis. These Terms will be governed by and interpreted in accordance with the local jurisdiction laws.
        </p>
      </div>
    </div>
  );
};
