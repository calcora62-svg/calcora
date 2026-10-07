import React, { useState, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { getToolById } from '../../data/tools';
import { Button } from '../../components/ui/Button';
import { UploadCloud, RefreshCw, Smartphone, Monitor, LayoutGrid, Award } from 'lucide-react';

export const ThumbnailPreview = () => {
  const tool = getToolById('thumbnail-preview');

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Custom mock information
  const [title, setTitle] = useState('My Awesome Content Creation Secrets Revealed! (2026)');
  const [channel, setChannel] = useState('Creator Pro');
  const [views, setViews] = useState('142K views');
  const [time, setTime] = useState('2 days ago');

  const [layoutMode, setLayoutMode] = useState<'all' | 'desktop' | 'mobile' | 'sidebar'>('all');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type.startsWith('image/')) {
        setFile(selected);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
  };

  if (!tool) return null;

  return (
    <ToolWrapper tool={tool}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{tool.name}</h1>
          <p className="text-muted-fg">{tool.description}</p>
        </div>

        {!file ? (
          <div 
            className="border-2 border-dashed rounded-3xl p-12 text-center border-border-color bg-card hover:border-primary-400 hover:bg-muted-bg/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
            onClick={() => document.getElementById('preview-file-input')?.click()}
          >
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Upload your thumbnail</h3>
            <p className="text-muted-fg mb-4">Drag and drop, or click to browse</p>
            <p className="text-xs text-muted-fg">Supports JPEG, PNG, WEBP</p>
            <input 
              id="preview-file-input"
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect} 
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar Controls */}
            <div className="space-y-6 bg-card border border-border-color p-6 rounded-2xl h-fit">
              <h3 className="font-bold text-lg text-foreground border-b border-border-color pb-3">Mock Video Metadata</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Video Title</label>
                  <textarea 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    rows={3}
                    maxLength={100}
                    className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Channel Name</label>
                  <input 
                    type="text"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Views</label>
                    <input 
                      type="text"
                      value={views}
                      onChange={(e) => setViews(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Date Offset</label>
                    <input 
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border-color space-y-3">
                <h4 className="font-semibold text-sm uppercase text-muted-fg tracking-wider">Mockup Layout Mode</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setLayoutMode('all')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      layoutMode === 'all' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" /> All
                  </button>
                  <button 
                    onClick={() => setLayoutMode('desktop')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      layoutMode === 'desktop' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    <Monitor className="w-4 h-4" /> Desktop
                  </button>
                  <button 
                    onClick={() => setLayoutMode('mobile')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      layoutMode === 'mobile' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Mobile
                  </button>
                  <button 
                    onClick={() => setLayoutMode('sidebar')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      layoutMode === 'sidebar' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Sidebar
                  </button>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Change Image
              </Button>
            </div>

            {/* Display/Mockup Previews */}
            <div className="lg:col-span-2 space-y-8">
              {/* Desktop Preview Grid Item */}
              {(layoutMode === 'all' || layoutMode === 'desktop') && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-fg uppercase tracking-wider flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Desktop Feed Card (Home/Grid)
                  </h4>
                  <div className="bg-[#f9f9f9] dark:bg-[#0f0f0f] border border-border-color p-6 rounded-2xl flex justify-center">
                    <div className="w-full max-w-[340px] bg-transparent flex flex-col group cursor-pointer text-left">
                      {/* Image aspect-video */}
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-muted-bg relative">
                        {previewUrl && <img src={previewUrl} alt="Thumbnail desktop mock" className="w-full h-full object-cover" />}
                        <span className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-[11px] font-medium text-white rounded">
                          12:35
                        </span>
                      </div>
                      {/* Meta layout */}
                      <div className="flex gap-3 mt-3">
                        <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          C
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-[14px] leading-tight text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 mb-1">
                            {title || 'Untitled Video'}
                          </h5>
                          <p className="text-[12px] text-[#606060] dark:text-[#aaa] hover:text-[#0f0f0f] dark:hover:text-white transition-colors truncate">
                            {channel || 'Creator channel'}
                          </p>
                          <div className="flex items-center text-[12px] text-[#606060] dark:text-[#aaa] mt-0.5">
                            <span>{views || '0 views'}</span>
                            <span className="mx-1.5">•</span>
                            <span>{time || 'Just now'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Feed Large Card */}
              {(layoutMode === 'all' || layoutMode === 'mobile') && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-fg uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Mobile Search/Home Feed
                  </h4>
                  <div className="bg-[#f9f9f9] dark:bg-[#0f0f0f] border border-border-color p-6 rounded-2xl flex justify-center">
                    <div className="w-full max-w-[375px] bg-transparent border-x border-border-color overflow-hidden flex flex-col text-left">
                      {/* Full Width Image aspect-video */}
                      <div className="w-full aspect-video bg-muted-bg relative">
                        {previewUrl && <img src={previewUrl} alt="Thumbnail mobile mock" className="w-full h-full object-cover" />}
                        <span className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-[11px] font-medium text-white rounded">
                          12:35
                        </span>
                      </div>
                      {/* Meta layout */}
                      <div className="flex gap-3 p-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          C
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-[15px] leading-snug text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2">
                            {title || 'Untitled Video'}
                          </h5>
                          <div className="flex items-center gap-1.5 text-[12px] text-[#606060] dark:text-[#aaa] mt-1">
                            <span>{channel || 'Creator channel'}</span>
                            <span>•</span>
                            <span>{views || '0 views'}</span>
                            <span>•</span>
                            <span>{time || 'Just now'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sidebar layout */}
              {(layoutMode === 'all' || layoutMode === 'sidebar') && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-fg uppercase tracking-wider">
                    Sidebar Up Next / Recommended List Card
                  </h4>
                  <div className="bg-[#f9f9f9] dark:bg-[#0f0f0f] border border-border-color p-6 rounded-2xl flex justify-center">
                    <div className="w-full max-w-[340px] flex gap-3 text-left">
                      {/* Small horizontal video thumbnail */}
                      <div className="w-[168px] aspect-video rounded-lg overflow-hidden bg-muted-bg shrink-0 relative">
                        {previewUrl && <img src={previewUrl} alt="Thumbnail sidebar mock" className="w-full h-full object-cover" />}
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-[10px] font-medium text-white rounded">
                          12:35
                        </span>
                      </div>
                      {/* Details next to it */}
                      <div className="flex-1 min-w-0 flex flex-col justify-start">
                        <h5 className="font-semibold text-[13px] leading-tight text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-2 mb-1">
                          {title || 'Untitled Video'}
                        </h5>
                        <p className="text-[11px] text-[#606060] dark:text-[#aaa] truncate">
                          {channel || 'Creator channel'}
                        </p>
                        <div className="flex items-center text-[11px] text-[#606060] dark:text-[#aaa] mt-0.5">
                          <span>{views || '0 views'}</span>
                        </div>
                        <p className="text-[11px] text-[#606060] dark:text-[#aaa] mt-0.5">
                          {time || 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};
