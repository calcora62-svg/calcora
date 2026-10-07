import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ChevronRight, ArrowLeft, Calendar, User, Clock, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  content: React.ReactNode;
}

const BLOG_POSTS: Record<string, BlogPost> = {
  'how-to-clean-shopify-csv': {
    slug: 'how-to-clean-shopify-csv',
    title: 'How to Clean Shopify Product CSVs Without Messing Up HTML',
    description: 'Learn how to normalize catalog titles, trim whitespace, and clean duplicates while preserving your rich descriptions.',
    date: 'March 14, 2026',
    author: 'Calcora Team',
    readTime: '2 min read',
    category: 'Data Management',
    content: (
      <div className="space-y-6 prose dark:prose-invert">
        <p className="text-base text-muted-fg leading-relaxed">
          As a Shopify store owner, managing product listings in bulk can be a headache. Whether you are importing listings from a supplier or migrating your catalog, you will likely end up with messy CSVs filled with duplicated rows, empty columns, and inconsistent whitespace.
        </p>
        <h3 className="text-lg font-bold text-foreground">Why Standard Excel Cleaning is Dangerous</h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          Standard spreadsheet programs often corrupt cell formats when saving CSVs. Long numeric product IDs, barcode numbers (UPC/EAN), or product handle strings can get mutated into scientific notation (like 1.23E+11) or have leading zeros stripped.
        </p>
        <blockquote className="border-l-4 border-primary pl-4 py-1 italic my-4 text-xs bg-muted-bg/35 rounded-r-lg p-2 text-foreground">
          "Always verify your spreadsheet columns are treated as raw text before applying edits. Never let your editor auto-format long numeric barcode strings."
        </blockquote>
        <h3 className="text-lg font-bold text-foreground">Steps to Clean Your Catalog safely using Calcora</h3>
        <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-fg leading-relaxed">
          <li>Upload your Shopify product CSV file using Calcora Excel / CSV Cleaner.</li>
          <li>Enable the <strong>Remove duplicate rows</strong> toggle, selecting only the 'Handle' or 'Variant SKU' column.</li>
          <li>Apply the <strong>Trim whitespace</strong> setting to clean up trailing spacing in product titles and tags.</li>
          <li>Preview and verify row comparisons. If columns look aligned, click <strong>Apply & Export</strong>.</li>
        </ol>
      </div>
    )
  },
  'amazon-product-image-size-guide': {
    slug: 'amazon-product-image-size-guide',
    title: 'Amazon Product Image Size Guide: Fit Guidelines for 2026',
    description: 'Avoid listing suppression by following Amazon\'s strict photo parameters. Batch format with white backdrops.',
    date: 'February 28, 2026',
    author: 'Calcora Team',
    readTime: '2 min read',
    category: 'Product Imaging',
    content: (
      <div className="space-y-6 prose dark:prose-invert">
        <p className="text-base text-muted-fg leading-relaxed">
          Amazon requires that all product photos meet stringent guidelines to provide a consistent purchasing experience. Failing to conform to these rules can result in listing suppression or decreased visibility.
        </p>
        <h3 className="text-lg font-bold text-foreground">Amazon's Strict Image Parameters</h3>
        <ul className="list-disc pl-5 space-y-2 text-xs text-muted-fg leading-relaxed">
          <li><strong>Dimensions:</strong> Minimum 1600px on the longest side (to activate zoom), recommended 2000px x 2000px.</li>
          <li><strong>Main Image Backdrop:</strong> Must be a pure white background (RGB 255, 255, 255).</li>
          <li><strong>Fill Area:</strong> Product must fill at least 85% of the overall frame.</li>
          <li><strong>Format:</strong> JPEG (.jpg or .jpeg) is highly preferred, though PNG and TIFF are accepted.</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground">How Calcora Streamlines the Image Preparation</h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          Instead of manually resizing photos and adding backdrops in Photoshop, you can upload your source snapshots to the <strong>Product Photo Batch</strong> on Calcora. Select the <strong>Amazon Preset (2000x2000)</strong>, enable the <strong>White Background</strong> option, adjust crop spacing to 85%, and export a zipped bundle of web-ready files in seconds.
        </p>
      </div>
    )
  },
  'tiktok-captions-without-watermark': {
    slug: 'tiktok-captions-without-watermark',
    title: 'How to Add Beautiful Synced Captions in Your Browser (No Watermarks)',
    description: 'Learn how to generate and burn subtitles on your short videos locally without watermark restrictions.',
    date: 'January 19, 2026',
    author: 'Calcora Team',
    readTime: '2 min read',
    category: 'Video Marketing',
    content: (
      <div className="space-y-6 prose dark:prose-invert">
        <p className="text-base text-muted-fg leading-relaxed">
          Short vertical video content is driving the majority of ecommerce traffic today. However, over 80% of users watch reels or TikTok videos on mute. If you are not including bold, synced subtitles, you are missing out on engagement.
        </p>
        <h3 className="text-lg font-bold text-foreground">The Local Caption Revolution</h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          Traditional web applications require you to upload heavy gigabyte-scale videos to remote servers to generate subtitles, presenting privacy and copyright risks. Calcora's Social Video Maker uses browser-based caption overlays and Canvas synchronizers to burn captions locally in your browser memory.
        </p>
        <h3 className="text-lg font-bold text-foreground">Captivating Subtitle Best Practices</h3>
        <ul className="list-disc pl-5 space-y-2 text-xs text-muted-fg leading-relaxed">
          <li>Keep text font sizes large and placed in the center vertical safe zone (avoiding UI overlays).</li>
          <li>Add a subtle contrasting backdrop behind characters to guarantee readability across light/dark scenes.</li>
          <li>Limit subtitles to 3–4 words per line to encourage rapid pacing and maintain attention.</li>
        </ul>
      </div>
    )
  },
  'best-free-csv-cleaner-shopify': {
    slug: 'best-free-csv-cleaner-shopify',
    title: 'Best Free Shopify CSV Cleaner in 2026 (No Upload Required)',
    description: 'Clean your Shopify product CSVs without uploading to any server. Free, private, browser-based tool.',
    date: 'October 5, 2025',
    author: 'Calcora Team',
    readTime: '2 min read',
    category: 'Ecommerce Tools',
    content: (
      <div className="space-y-6 prose dark:prose-invert">
        <p className="text-base text-muted-fg leading-relaxed">
          If you sell on Shopify, you know the pain. You export your product list as a CSV, and it's a mess — duplicate rows, blank lines, inconsistent spacing, and formatting that breaks when you re-import. Most online tools make it worse by asking you to upload your business data to their server.
        </p>

        <h3 className="text-lg font-bold text-foreground">Why Most CSV Cleaners Are Risky</h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          When you upload your Shopify CSV to a web-based tool, your product names, pricing, SKUs, and supplier data are stored on their servers. For ecommerce sellers, this is a real privacy and security concern.
        </p>

        <blockquote className="border-l-4 border-primary pl-4 py-1 italic my-4 text-xs bg-muted-bg/35 rounded-r-lg p-2 text-foreground">
          "Your product catalog is your business. You shouldn't have to upload it to clean it."
        </blockquote>

        <h3 className="text-lg font-bold text-foreground">How Calcora's CSV Cleaner is Different</h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          Calcora's Excel / CSV Cleaner processes your file <strong>entirely in your browser</strong>. Nothing is uploaded. Nothing is stored. Nothing leaves your computer.
        </p>

        <h3 className="text-lg font-bold text-foreground">How to Clean Your Shopify CSV in 7 Steps</h3>
        <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-fg leading-relaxed">
          <li>Go to Calcora's Excel / CSV Cleaner.</li>
          <li>Upload your Shopify product CSV (or drag & drop it).</li>
          <li>Enable <strong>"Remove duplicate rows"</strong> and select the "Handle" or "Variant SKU" column.</li>
          <li>Enable <strong>"Trim leading/trailing cells"</strong> to remove extra spaces.</li>
          <li>Enable <strong>"Remove fully blank rows"</strong> to strip empty lines.</li>
          <li>Click <strong>"Preview Changes"</strong> to see before/after row counts.</li>
          <li>Click <strong>"Apply & Export"</strong> to download your cleaned CSV.</li>
        </ol>

        <h3 className="text-lg font-bold text-foreground">What You Get</h3>
        <p className="text-xs text-muted-fg leading-relaxed">
          A clean, duplicate-free Shopify CSV that re-imports without errors. No upload, no server, no risk.
        </p>

        <p className="text-xs text-muted-fg leading-relaxed">
          Try it free — 5 uses per day, no signup required.
        </p>
      </div>
    )
  }
};

export const Blog = () => {
  const { slug } = useParams<{ slug?: string }>();

  if (slug) {
    const post = BLOG_POSTS[slug];

    if (!post) {
      return (
        <PageWrapper>
          <div className="py-20 text-center max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-fg mb-8">The requested blog post does not exist or was moved.</p>
            <Link to="/blog">
              <Button variant="primary">Return to Blog</Button>
            </Link>
          </div>
        </PageWrapper>
      );
    }

    return (
      <PageWrapper>
        <div className="py-16 px-6 max-w-3xl mx-auto animate-fade-in">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs text-muted-fg hover:text-primary mb-8 font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog Feed
          </Link>

          <span className="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider block w-max">
            {post.category}
          </span>

          <h1 className="text-3xl md:text-5xl font-black mt-4 mb-6 leading-tight text-foreground font-display">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-fg border-b border-border-color pb-8 mb-8">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <div className="space-y-6">
            {post.content}
          </div>

          <div className="border-t border-border-color mt-16 pt-8 text-center bg-muted-bg/10 p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-foreground mb-1">Process your data completely privately</h4>
            <p className="text-xs text-muted-fg mb-4 max-w-md mx-auto">
              Ready to clean handles, resize photos, or synchronise text? Try our suite completely client-side.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/tool/product-photo-batch">
                <Button variant="primary" size="sm">Product Photo Batch</Button>
              </Link>
              <Link to="/tool/excel-csv-cleaner">
                <Button variant="outline" size="sm">Excel Cleaner</Button>
              </Link>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="py-16 px-6 max-w-5xl mx-auto animate-fade-in">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Ecommerce Blog
          </span>
          <h1 className="text-3xl md:text-5xl font-black mt-4 mb-4 tracking-tight font-display text-foreground">
            Sellers Insights & Guides
          </h1>
          <p className="text-sm text-muted-fg leading-relaxed">
            Tips, tutorials, and deep-dives on preparing product photos, organizing Shopify CSV listings, and mastering vertical video overlays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.values(BLOG_POSTS).map((post) => (
            <Link 
              key={post.slug} 
              to={`/blog/${post.slug}`}
              className="bg-card border border-border-color hover:border-primary-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col h-full group"
            >
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-widest block mb-2">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary-600 transition-colors mb-2 leading-snug font-display">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-fg leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-fg border-t border-border-color pt-4 mt-6">
                  <span>{post.date}</span>
                  <span className="font-bold text-primary-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Read Article
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};