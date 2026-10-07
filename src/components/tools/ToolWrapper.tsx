import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Share2, Info } from 'lucide-react';
import { ToolItem } from '../../data/tools';
import { useAppStore } from '../../store/useAppStore';
import { PageWrapper } from '../layout/PageWrapper';
import { Button } from '../ui/Button';
import { RelatedTools } from './RelatedTools';
import { SEO } from '../common/SEO';
import { getSeoDataForTool } from '../../data/seoMetadata';

export const ToolWrapper = ({ 
  tool, 
  children,
  howToUse,
  faq
}: { 
  tool: ToolItem; 
  children: React.ReactNode;
  howToUse?: React.ReactNode;
  faq?: { q: string; a: string }[];
}) => {
  const { favorites, toggleFavorite } = useAppStore();
  const isFavorite = favorites.includes(tool.id);

  const seoData = getSeoDataForTool(tool.id, tool.name, tool.description);
  const finalFaq = faq || seoData.faq;

  const renderHowToUse = howToUse || (
    <ol className="list-decimal list-inside space-y-2">
      {seoData.howToUse.map((step, idx) => (
        <li key={idx} className="leading-relaxed">{step}</li>
      ))}
    </ol>
  );

  const categoryName = tool.categoryId === 'pdf-document' ? 'PDF & Document' : tool.categoryId.replace('-', ' ');

  const breadcrumbData = [
    { name: 'Home', item: '/' },
    { name: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Tools`, item: `/category/${tool.categoryId}` },
    { name: tool.name, item: tool.route }
  ];

  return (
    <PageWrapper className="pt-8 pb-24">
      <SEO 
        title={seoData.seoTitle}
        description={seoData.seoDescription}
        path={tool.route}
        keywords={seoData.keywords}
        faq={finalFaq}
        breadcrumb={breadcrumbData}
      />
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-fg mb-8">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link to={`/category/${tool.categoryId}`} className="hover:text-primary-600 transition-colors capitalize">
            {categoryName}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-foreground font-medium">{tool.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{tool.name}</h1>
            <p className="text-lg text-muted-fg max-w-2xl">{tool.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => toggleFavorite(tool.id)} aria-label="Toggle favorite">
              <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" aria-label="Share">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Backend Note if applicable */}
        {tool.requiresBackend && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl flex gap-3 border border-blue-200 dark:border-blue-800/30">
            <Info className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm mb-1">Server processing required</p>
              <p className="text-sm opacity-90">This tool requires a backend integration to function. The UI is demonstrated below.</p>
            </div>
          </div>
        )}
        
        {tool.isBeta && (
  <div className="mb-8 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl p-3 flex items-start gap-2.5">
    <span className="text-orange-600 dark:text-orange-400 text-sm shrink-0 mt-0.5">⚠️</span>
    <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
      <strong>Beta:</strong> This tool uses browser-based WebAssembly and may take longer on slower devices. Best experienced on desktop with good internet.
    </p>
  </div>
)}

        {/* Tool Workspace */}
        <div className="bg-card border border-border-color rounded-3xl p-6 md:p-12 mb-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          {children}
        </div>

        {/* SEO & Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">How to use this tool</h2>
              <div className="prose dark:prose-invert max-w-none text-muted-fg">
                {renderHowToUse}
              </div>
            </section>
            {finalFaq && finalFaq.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {finalFaq.map((item, i) => (
                    <div key={i} className="bg-muted-bg/50 p-6 rounded-2xl">
                      <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
                      <p className="text-muted-fg text-sm leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Related Tools */}
        <div className="mt-16">
          <RelatedTools currentTool={tool} />
        </div>

      </div>
    </PageWrapper>
  );
};
