import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Video, Image as ImageIcon, FileText, Music, Scissors, Minimize2, ArrowRightLeft, Type, SplitSquareHorizontal, Combine, Grid, Box as ObjectIcon, RefreshCw } from 'lucide-react';
import { ToolItem, getToolById, getToolsByCategory } from '../../data/tools';

const ICONS: Record<string, any> = {
  Video, ImageIcon, FileText, Music, Scissors, Minimize2, ArrowRightLeft, Type, SplitSquareHorizontal, Combine, Grid, ObjectIcon, RefreshCw
};

export const RelatedTools = ({ currentTool }: { currentTool: ToolItem }) => {
  let related: ToolItem[] = [];

  // 1. Try manual related tools
  if (currentTool.relatedTools && currentTool.relatedTools.length > 0) {
    related = currentTool.relatedTools.map(id => getToolById(id)).filter(Boolean) as ToolItem[];
  }

  // 2. If empty or not enough, fill with tools from the same category
  if (related.length < 4) {
    const categoryTools = getToolsByCategory(currentTool.categoryId).filter(t => t.id !== currentTool.id);
    const needed = 4 - related.length;
    for (let i = 0; i < categoryTools.length && needed > 0; i++) {
      if (!related.find(r => r.id === categoryTools[i].id)) {
        related.push(categoryTools[i]);
      }
    }
  }

  // Limit to exactly 4 tools if possible
  related = related.slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold text-foreground mb-8">You might also need</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map(tool => {
          const Icon = ICONS[tool.iconName] || FileText;
          return (
            <Link
              key={tool.id}
              to={tool.route}
              className="group block p-6 bg-card border border-border-color rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{tool.name}</h3>
              <p className="text-sm text-muted-fg line-clamp-2 mb-6">{tool.description}</p>
              
              <div className="flex items-center text-primary-600 text-sm font-semibold mt-auto absolute bottom-6">
                Use Tool
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
