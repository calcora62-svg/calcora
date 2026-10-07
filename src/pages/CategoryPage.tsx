import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { getToolsByCategory, CATEGORIES } from '../data/tools';
import { ToolCard } from '../components/tools/ToolCard';
import { PageWrapper } from '../components/layout/PageWrapper';

export const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const category = CATEGORIES.find(c => c.id === id);
  
  if (!category) {
    return <Navigate to="/tools" replace />;
  }

  const categoryTools = getToolsByCategory(id!);
  const Icon = category.icon;

  return (
    <PageWrapper className="pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 mb-6 flex items-center justify-center">
            <Icon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{category.name}</h1>
          <p className="text-lg text-muted-fg">{category.description}</p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {categoryTools.map(tool => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={tool.id}
            >
              <ToolCard tool={tool} />
            </motion.div>
          ))}
        </motion.div>
        
        {categoryTools.length === 0 && (
          <div className="text-center py-24 text-muted-fg bg-muted-bg/30 rounded-3xl mt-8">
            <p>More tools coming to this category soon.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
