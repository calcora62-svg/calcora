import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TOOLS, CATEGORIES } from '../data/tools';
import { ToolCard } from '../components/tools/ToolCard';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';

export const AllTools = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTools = activeCategory === 'all' 
    ? TOOLS 
    : TOOLS.filter(t => t.categoryId === activeCategory);

  return (
    <PageWrapper className="pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">All Tools</h1>
          <p className="text-lg text-muted-fg">Explore our complete collection of smart utilities designed to make your everyday digital tasks simpler and faster.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <Button 
            variant={activeCategory === 'all' ? 'primary' : 'secondary'} 
            onClick={() => setActiveCategory('all')}
            className="rounded-full"
          >
            All Tools
          </Button>
          {CATEGORIES.map(cat => (
            <Button 
              key={cat.id}
              variant={activeCategory === cat.id ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory(cat.id)}
              className="rounded-full"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredTools.map(tool => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={tool.id}
            >
              <ToolCard tool={tool} />
            </motion.div>
          ))}
        </motion.div>
        
        {filteredTools.length === 0 && (
          <div className="text-center py-24 text-muted-fg">
            <p>No tools found for this category yet.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
