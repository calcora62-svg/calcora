import React from 'react';
import { Link } from 'react-router-dom';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { getToolById } from '../../data/tools';
import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ComingSoonTool = ({ toolId }: { toolId: string }) => {
  const tool = getToolById(toolId);
  if (!tool) return null;

  return (
    <ToolWrapper tool={tool}>
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-amber-200 dark:border-amber-800/40">
          <Clock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 mb-4 border border-amber-200 dark:border-amber-800/50">
          Coming Soon
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">{tool.name}</h1>
        <p className="text-muted-fg text-base mb-8 max-w-lg mx-auto">{tool.description}</p>

        <div className="bg-card border border-border-color rounded-2xl p-6 text-left shadow-sm space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                This tool requires server processing. Coming soon!
              </h3>
              <p className="text-sm text-muted-fg leading-relaxed">
                All active Calcora tools process your documents 100% locally in your browser for absolute privacy and zero upload latency. 
                Full conversion for this proprietary document format requires sandboxed server infrastructure, which is currently scheduled for an upcoming release.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/tools">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Browse Browser-Based Tools
            </Button>
          </Link>
        </div>
      </div>
    </ToolWrapper>
  );
};
