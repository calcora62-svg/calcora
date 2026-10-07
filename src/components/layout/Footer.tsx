import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border-color bg-card mt-24">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Flagship Suite</h3>
            <ul className="space-y-2 text-sm text-muted-fg">
              <li><Link to="/tool/social-video-maker" className="hover:text-primary-600 transition-colors">Social Video Maker</Link></li>
              <li><Link to="/tool/product-photo-batch" className="hover:text-primary-600 transition-colors">Product Photo Batch</Link></li>
              <li><Link to="/tool/excel-csv-cleaner" className="hover:text-primary-600 transition-colors">Excel / CSV Cleaner</Link></li>
              <li><Link to="/tools" className="hover:text-primary-600 transition-colors">Explore All Tools</Link></li>
            </ul>
          </div>
          <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-fg">
              <li><Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund" className="hover:text-primary-600 transition-colors">Refund Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-primary-600 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary-600 transition-colors">Disclaimer</Link></li>
             </ul>
           </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-fg">
              <li><Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Ecommerce Resources</h3>
            <ul className="space-y-2 text-sm text-muted-fg">
              <li><Link to="/blog/how-to-clean-shopify-csv" className="hover:text-primary-600 transition-colors">Shopify CSV Cleaning Guide</Link></li>
              <li><Link to="/blog/amazon-product-image-size-guide" className="hover:text-primary-600 transition-colors">Amazon Image Size Guide</Link></li>
              <li><Link to="/blog/tiktok-captions-without-watermark" className="hover:text-primary-600 transition-colors">TikTok Subtitles Guide</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border-color flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="text-foreground font-semibold">Calcora</span>
            <span className="text-xs text-muted-fg border-l border-border-color pl-2 font-medium">Private. Fast. No uploads.</span>
          </div>
          <p className="text-sm text-muted-fg">
            © {new Date().getFullYear()} Calcora. All tools process your files locally in the browser.
          </p>
        </div>
      </div>
    </footer>
  );
};
