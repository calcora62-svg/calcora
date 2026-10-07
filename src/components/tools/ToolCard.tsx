import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ToolItem } from '../../data/tools';
import * as Icons from 'lucide-react';

export const ToolCard = ({ tool }: { tool: ToolItem }) => {
  // @ts-ignore
  const Icon = Icons[tool.iconName] || Icons.Wrench;

  return (
    <Link to={tool.route} className="block group">
      <motion.div 
        className="h-full p-6 bg-card border border-border-color rounded-2xl transition-all duration-300 relative overflow-hidden group-hover:border-primary-500/50 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)]"
        whileHover={{ y: -4, scale: 1.015 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary-600 transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-muted-fg line-clamp-2">
          {tool.description}
        </p>
        {tool.isBeta && (
  <div className="absolute top-4 right-4">
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
      Beta
    </span>
  </div>
)}

        {tool.implementationStatus === 'coming-soon' && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              Coming Soon
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
};
