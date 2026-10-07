import React from 'react';
import { SEO } from '../../components/common/SEO';
import { Shield, Sparkles, Cpu, Award } from 'lucide-react';

export const About = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <SEO 
        title="About Us - Calcora" 
        description="Learn more about Calcora's privacy-first, offline-ready web utilities and file conversion tools."
        path="/about"
      />
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-6">About Calcora</h1>
        <p className="text-xl text-muted-fg max-w-2xl mx-auto">
          We are building the future of web utility tools—fast, privacy-respecting, and processed locally in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-3xl bg-card border border-border-color space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Privacy First</h2>
          <p className="text-muted-fg leading-relaxed">
            Unlike traditional web tools that upload your sensitive documents and images to external cloud servers, Calcora processes your files right inside your browser. Your data never leaves your device.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-card border border-border-color space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">WebGPU & WASM Powered</h2>
          <p className="text-muted-fg leading-relaxed">
            By leveraging advanced technologies like WebAssembly, Canvas APIs, and on-device ML models, we bring complex image and video processing directly to your local hardware for extreme speeds.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-card border border-border-color space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Lightweight & Fast</h2>
          <p className="text-muted-fg leading-relaxed">
            Calcora is designed from the ground up to be incredibly lightweight, modern, and high-performance. No unnecessary bloat, no intrusive popups—just clean, fast tools that work.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-card border border-border-color space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Reliable Performance</h2>
          <p className="text-muted-fg leading-relaxed">
            For heavy processing tasks, we use Web Workers and optimized browser pipelines to keep your workflows smooth and responsive—without uploading your files anywhere.
          </p>
        </div>
      </div>

      <section className="prose dark:prose-invert max-w-none text-muted-fg space-y-6">
        <h2 className="text-3xl font-bold text-foreground font-display">Our Mission</h2>
        <p className="leading-relaxed">
          Calcora was founded to solve a simple problem: web utilities are often bloated, filled with invasive ads, and compromise user security. We believe that file conversion, spreadsheet cleaning, and image processing should be fast, private, and beautifully designed.
        </p>
        <p className="leading-relaxed">
          Through modern browser standards, we aim to deliver a seamless utility suite that values your time and your data above all else. No signup, no uploads, and no compromises on your privacy.
        </p>
      </section>
    </div>
  );
};