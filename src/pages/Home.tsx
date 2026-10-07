import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Check, ArrowRight, Star, Sparkles, FileText, 
  ImageIcon, Video, Music, HelpCircle, ArrowRightLeft,
  ChevronRight, Scissors, Minimize2, Laptop, CloudLightning,
  CheckCircle, Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { TOOLS } from '../data/tools';
import { ToolCard } from '../components/tools/ToolCard';
import { SEO } from '../components/common/SEO';
import { usePlanStore } from '../store/usePlanStore';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } }
};

export const Home = () => {
  const navigate = useNavigate();
  const { activePlan } = usePlanStore();
  const moreToolsRef = useRef<HTMLDivElement>(null);

  const flagshipTools = TOOLS.filter(t => 
    ['excel-csv-cleaner', 'product-photo-batch', 'social-video-maker'].includes(t.id)
  );

  const secondaryTools = TOOLS.filter(t => 
    t.implementationStatus === 'live' && 
    !['excel-csv-cleaner', 'product-photo-batch', 'social-video-maker'].includes(t.id) &&
    !['aspect-ratio-calculator'].includes(t.id)
  ).slice(0, 8);

  const scrollToMoreTools = () => {
    moreToolsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageWrapper>
      <SEO 
        title="Calcora — Private, Browser-Based Tools for Ecommerce Sellers"
        description="Clean spreadsheets, batch resize product photos, and make social videos without uploading files. Secure, fast, and watermark-free."
        path="/"
        keywords={['ecommerce tools', 'excel cleaner', 'csv optimizer', 'photo batch resizer', 'social video creator', 'shopify images', 'amazon photo dimensions']}
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden flex flex-col items-center bg-muted-bg/5 border-b border-border-color">
        <div className="absolute top-[10%] left-[5%] w-48 h-48 rounded-full bg-primary-500/5 blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-72 h-72 rounded-full bg-blue-500/5 blur-3xl -z-10" />

        <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center">
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-6">
            <motion.div 
              variants={fadeUp} 
              style={{ backgroundColor: '#17175f' }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private. Fast. No uploads.</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight max-w-3xl mx-auto font-display">
              Private tools for <span className="text-primary-600">ecommerce sellers</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-fg max-w-xl mx-auto leading-relaxed">
              No uploads. No watermarks. Built for Shopify, Amazon, Etsy, and TikTok sellers.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link to="/tool/product-photo-batch" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:px-8 font-extrabold flex items-center justify-center gap-2">
                  Try Product Photo Batch — Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={scrollToMoreTools}
                className="w-full sm:w-auto sm:px-8 font-bold text-muted-fg hover:text-foreground"
              >
                Browse all tools
              </Button>
            </motion.div>

            <motion.div 
              variants={fadeUp} 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto text-left border-t border-border-color"
            >
              {[
                "Files stay in browser",
                "No watermark",
                "No signup",
                "Works offline"
              ].map((badge, i) => (
                <div key={i} className="flex items-start gap-2 bg-card p-3 rounded-xl border border-border-color shadow-2xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-foreground leading-tight">{badge}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Flagship Tools Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-primary-600 dark:text-primary-400 text-xs font-extrabold uppercase tracking-widest block mb-2">
              FLAGSHIP ECOMMERCE SUITE
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">
              Designed for professional sellers
            </h2>
            <p className="text-sm text-muted-fg mt-2 max-w-md mx-auto">
              Optimized workflows for Shopify, Amazon, Etsy, eBay, and TikTok Shop. No watermark, high quality, and instant export.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1: Excel / CSV Cleaner */}
            <div className="bg-card border border-border-color hover:border-primary-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
              <div className="absolute top-4 right-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                5 uses/day free
              </div>
              <div>
                <div className="w-12 h-12 bg-green-50 dark:bg-green-950/40 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors font-display">
                  Excel / CSV Cleaner
                </h3>
                <p className="text-xs text-muted-fg leading-relaxed mb-6">
                  Prune, trim, and normalize catalog files. Deduplicate, find & replace, split columns, and clean structure without server-side leaks.
                </p>
              </div>
              <Link to="/tool/excel-csv-cleaner" className="block mt-4">
                <Button variant="primary" className="w-full text-xs font-bold">Try Free</Button>
              </Link>
            </div>

            {/* Card 2: Product Photo Batch */}
            <div className="bg-card border border-border-color hover:border-primary-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
              <div className="absolute top-4 right-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                5 uses/day free
              </div>
              <div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors font-display">
                  Product Photo Batch
                </h3>
                <p className="text-xs text-muted-fg leading-relaxed mb-6">
                  Batch resize and fit assets to Shopify, Amazon, and Etsy specs. Clean backgrounds, adjust paddings, compress, and download a ZIP file instantly.
                </p>
              </div>
              <Link to="/tool/product-photo-batch" className="block mt-4">
                <Button variant="primary" className="w-full text-xs font-bold">Try Free</Button>
              </Link>
            </div>

            {/* Card 3: Social Video Maker */}
            <div className="bg-card border border-border-color hover:border-primary-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative">
              <div className="absolute top-4 right-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                5 uses/day free
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary-600 transition-colors font-display">
                  Social Video Maker
                </h3>
                <p className="text-xs text-muted-fg leading-relaxed mb-6">
                  Convert horizontal clips to vertical 9:16 reels/TikTok videos. Trim lengths, add synced subtitles, upload a logo watermark, and export MP4 locally.
                </p>
              </div>
              <Link to="/tool/social-video-maker" className="block mt-4">
                <Button variant="primary" className="w-full text-xs font-bold">Try Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* More Tools Section */}
      <section ref={moreToolsRef} className="py-16 bg-muted-bg/10 border-t border-b border-border-color">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-black text-foreground font-display">More Useful Utilities</h2>
            <p className="text-xs text-muted-fg mt-1">
              Select other direct file converters and local optimization widgets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {secondaryTools.map(tool => (
              <div key={tool.id} className="transition-transform duration-200 hover:-translate-y-1">
                <ToolCard tool={tool} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Preview Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span 
              style={{ backgroundColor: '#041629' }}
              className="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
            >
              Flexible Plan Model
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mt-4 tracking-tight font-display">
              Get higher limits with Calcora Premium
            </h2>
            <p className="text-xs text-muted-fg mt-2 font-medium">
              Free Plan includes 5 uses/day • Premium starts at $4.99/month launch special
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-card border border-border-color rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color bg-muted-bg/30 text-xs">
                  <th className="p-4 md:p-5 font-bold text-foreground uppercase tracking-wider">Feature Option</th>
                  <th className="p-4 md:p-5 font-bold text-foreground text-center">Free Plan</th>
                  <th className="p-4 md:p-5 font-bold text-primary-600 text-center">Premium Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color text-xs">
                <tr>
                  <td className="p-4 md:p-5 font-medium text-foreground">Daily uses</td>
                  <td className="p-4 md:p-5 text-center text-muted-fg">5 / day</td>
                  <td className="p-4 md:p-5 text-center font-bold text-primary-600">Higher fair-use limits</td>
                </tr>
                <tr>
                  <td className="p-4 md:p-5 font-medium text-foreground">Excel / CSV processing</td>
                  <td className="p-4 md:p-5 text-center text-muted-fg">Basic cleaning</td>
                  <td className="p-4 md:p-5 text-center font-bold text-foreground">Advanced + larger files</td>
                </tr>
                <tr>
                  <td className="p-4 md:p-5 font-medium text-foreground">Product photos</td>
                  <td className="p-4 md:p-5 text-center text-muted-fg">Small batches (max 5)</td>
                  <td className="p-4 md:p-5 text-center font-bold text-foreground">Larger batches (max 100)</td>
                </tr>
                <tr>
                  <td className="p-4 md:p-5 font-medium text-foreground">Social video duration</td>
                  <td className="p-4 md:p-5 text-center text-muted-fg">Up to 30 seconds</td>
                  <td className="p-4 md:p-5 text-center font-bold text-foreground">Longer clips + high quality</td>
                </tr>
                <tr>
                  <td className="p-4 md:p-5 font-medium text-foreground">WASM / On-device ML tools</td>
                  <td className="p-4 md:p-5 text-center text-muted-fg">Enabled</td>
                  <td className="p-4 md:p-5 text-center font-bold text-foreground">Priority processing</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" className="w-full sm:w-auto h-11 text-xs px-8 font-semibold" onClick={() => navigate('/tools')}>
              Continue Free
            </Button>
            <Button variant="primary" className="w-full sm:w-auto h-11 text-xs px-8 font-bold" onClick={() => navigate('/pricing')}>
              Upgrade to Premium — $4.99/mo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer-styled taglines */}
      <section className="py-12 border-t border-border-color bg-muted-bg/5 text-center">
        <p className="text-xs text-muted-fg font-semibold tracking-wider uppercase mb-1">
          CALCORA INC.
        </p>
        <p className="text-base text-foreground font-extrabold tracking-tight">
          Private. Fast. No uploads.
        </p>
      </section>
    </PageWrapper>
  );
};