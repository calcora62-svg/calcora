import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { usePlanStore } from '../../store/usePlanStore';
import { Button } from '../ui/Button';

export const Header = () => {
  const { theme, setTheme, setSearchOpen } = useAppStore();
  const { activePlan, getRemainingUses } = usePlanStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { name: 'Tools', path: '/tools' },
    { name: 'Video Maker', path: '/tool/social-video-maker' },
    { name: 'Photo Batch', path: '/tool/product-photo-batch' },
    { name: 'Excel Cleaner', path: '/tool/excel-csv-cleaner' },
    { name: 'Blog', path: '/blog' },
  ];

  const remaining = getRemainingUses();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-color bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-extrabold">
              C
            </div>
            <span>Calcora</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted-bg ${
                  location.pathname === link.path ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-muted-fg hover:text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Plan Status Display */}
          <div className="hidden sm:flex items-center mr-2">
            {activePlan === 'free' ? (
              <Link 
                to="/pricing" 
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 flex items-center gap-1.5 transition-all"
              >
                Free Plan — {remaining} {remaining === 1 ? 'use' : 'uses'} left today
              </Link>
            ) : (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 flex items-center gap-1">
                ✨ Calcora Premium
              </span>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <div className="hidden md:flex items-center gap-2 ml-2 border-l border-border-color pl-4">
            {activePlan === 'free' && (
              <Link to="/pricing">
                <Button variant="outline" size="sm" className="bg-gradient-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-950 border-amber-300 font-bold transition-all shadow-sm">
                  Go Premium
                </Button>
              </Link>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile nav links and status dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-color bg-background/95 backdrop-blur-md py-4 px-4 space-y-3">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted-bg block ${
                  location.pathname === link.path ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-muted-fg'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-border-color flex flex-col gap-2">
            {activePlan === 'free' ? (
              <Link 
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 block transition-all"
              >
                Free Plan — {remaining} {remaining === 1 ? 'use' : 'uses'} left today
              </Link>
            ) : (
              <div className="text-center text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 block">
                ✨ Calcora Premium
              </div>
            )}
            {activePlan === 'free' && (
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button variant="primary" size="sm" className="w-full">Upgrade to Premium</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};