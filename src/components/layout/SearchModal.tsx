import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TOOLS } from '../../data/tools';
import * as Icons from 'lucide-react';

export const SearchModal = () => {
  const { isSearchOpen, setSearchOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Only search LIVE tools — exclude coming-soon
  const liveTools = TOOLS.filter(tool => tool.implementationStatus === 'live');

  const filteredTools = liveTools.filter(tool => 
    tool.name.toLowerCase().includes(query.toLowerCase()) || 
    tool.keywords.some(k => k.toLowerCase().includes(query.toLowerCase())) ||
    tool.categoryId.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleSelect = (route: string) => {
    setSearchOpen(false);
    navigate(route);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setSearchOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border border-border-color shadow-2xl rounded-2xl overflow-hidden z-50"
          >
            <div className="relative border-b border-border-color flex items-center px-4">
              <Search className="w-6 h-6 text-muted-fg shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, categories... (e.g. compress)"
                className="w-full h-16 bg-transparent border-none outline-none px-4 text-lg text-foreground placeholder:text-muted-fg/70"
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-2 hover:bg-muted-bg rounded-lg text-muted-fg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {query.trim() === '' ? (
                <div className="text-center py-10 text-muted-fg">
                  <p>Type to start searching</p>
                  <div className="flex justify-center gap-2 mt-4 flex-wrap">
                    <span className="px-3 py-1 bg-muted-bg rounded-full text-xs">Video</span>
                    <span className="px-3 py-1 bg-muted-bg rounded-full text-xs">Images</span>
                    <span className="px-3 py-1 bg-muted-bg rounded-full text-xs">PDF</span>
                  </div>
                </div>
              ) : filteredTools.length > 0 ? (
                <div className="space-y-2">
                  {filteredTools.map((tool) => {
                    // @ts-ignore
                    const Icon = Icons[tool.iconName] || Icons.Wrench;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleSelect(tool.route)}
                        className="w-full flex items-center text-left p-4 rounded-xl hover:bg-muted-bg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-foreground font-medium group-hover:text-primary-600 transition-colors">{tool.name}</h4>
                          <p className="text-xs text-muted-fg line-clamp-1">{tool.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-fg">
                  <p>No tools found for "{query}"</p>
                </div>
              )}
            </div>
            <div className="border-t border-border-color p-3 bg-muted-bg/30 text-xs text-muted-fg flex justify-between items-center">
              <span>Click any result to open the tool</span>
              <span><kbd className="font-mono bg-muted-bg px-2 py-1 rounded border border-border-color">ESC</kbd> to close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};