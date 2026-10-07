import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { 
  ImageIcon, Trash2, Sliders, Play, RefreshCw, AlertCircle, 
  FileArchive, CheckCircle, ShoppingBag, ArrowRight, Layers, 
  HelpCircle, Download, RotateCw, Sparkles, SlidersHorizontal, Check, Eye
} from 'lucide-react';
import JSZip from 'jszip';
import { Button } from '../../components/ui/Button';
import { usePlanStore } from '../../store/usePlanStore';
import { log, warn, error as logError } from '../../utils/logger';

interface ImageSettings {
  width: number;
  height: number;
  bgPreference: 'transparent' | 'white' | 'original' | 'black';
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 10 to 100
  rotation: number; // 0, 90, 180, 270
  watermark: string;
  padding: number; // percentage padding (0 - 45)
}

interface BatchItem {
  id: string;
  file: File;
  status: 'idle' | 'rendering' | 'success' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
  resultBlob?: Blob;
  settings: ImageSettings;
}

interface Preset {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  bgPreference: 'transparent' | 'white' | 'original' | 'black';
  format: 'png' | 'jpeg' | 'webp';
  desc: string;
}

const PRESETS: Preset[] = [
  { id: 'shopify', name: 'Shopify Square', width: 1024, height: 1024, aspectRatio: '1:1', bgPreference: 'white', format: 'webp', desc: 'WebP compressed square catalog listing.' },
  { id: 'amazon', name: 'Amazon Standard', width: 1500, height: 1500, aspectRatio: '1:1', bgPreference: 'white', format: 'jpeg', desc: 'High-res JPEG with standard pure white bg.' },
  { id: 'etsy', name: 'Etsy Premium', width: 2000, height: 2000, aspectRatio: '1:1', bgPreference: 'transparent', format: 'png', desc: 'Lossless transparent PNG catalog card.' },
  { id: 'ebay', name: 'eBay Optimized', width: 1600, height: 1600, aspectRatio: '1:1', bgPreference: 'white', format: 'jpeg', desc: 'JPEG layout optimized for fast mobile rendering.' },
  { id: 'instagram', name: 'Instagram Grid', width: 1080, height: 1080, aspectRatio: '1:1', bgPreference: 'original', format: 'webp', desc: 'Optimal square format feed crop.' },
  { id: 'tiktok', name: 'TikTok Catalog', width: 1080, height: 1920, aspectRatio: '9:16', bgPreference: 'original', format: 'webp', desc: 'Vertical listing standard for Tiktok Shops.' },
  { id: 'custom', name: 'Custom Aspect', width: 1200, height: 1200, aspectRatio: '1:1', bgPreference: 'transparent', format: 'png', desc: 'Tailor custom pixels, padding and rotators.' }
];

// Helper Component: Renders a thumbnail preview from a Raw File object, revoking the URL automatically on unmount.
const ThumbnailImage = ({ file }: { file: File }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!src) return <div className="w-full h-full bg-muted-bg/30 animate-pulse" />;
  return <img src={src} alt="queue-item" className="w-full h-full object-cover" />;
};

export const ProductPhotoBatch = () => {
  const tool = getToolById('product-photo-batch');
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Multi-step workspace state: 'upload' | 'edit' | 'export'
  const [step, setStep] = useState<'upload' | 'edit' | 'export'>('upload');

  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'after' | 'before'>('after');

  // Interactive settings presets and defaults
  const [selectedPresetId, setSelectedPresetId] = useState('shopify');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(1200);
  const [customBg, setCustomBg] = useState<'transparent' | 'white' | 'original' | 'black'>('transparent');
  const [customFormat, setCustomFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [customQuality, setCustomQuality] = useState(85);
  const [customRotation, setCustomRotation] = useState(0);
  const [watermarkText, setWatermarkText] = useState('');
  const [paddingPct, setPaddingPct] = useState(10);
  const [renamePrefix, setRenamePrefix] = useState('listing_item');

  // Confirmation banner notification state
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);

  // Canvas element reference for real-time live preview rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Auto clean memory pointers
  useEffect(() => {
    return () => {
      batch.forEach(item => {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
      if (zipDownloadUrl) URL.revokeObjectURL(zipDownloadUrl);
    };
  }, [zipDownloadUrl]);

  // Retrieve current active item from queue selection
  const activeItem = batch.find(i => i.id === activeItemId) || batch[0];

  // Load active image once into memory from raw File, preventing multiple render pass onload race conditions
  useEffect(() => {
    if (!activeItem) {
      setLoadedImage(null);
      return;
    }
    log(`[Preview load] Creating transient preview URL for file: ${activeItem.file.name}`);
    const tempUrl = URL.createObjectURL(activeItem.file);
    const img = new Image();
    img.onload = () => {
      log(`[Preview load] Preview image fully loaded into memory. Revoking transient URL.`);
      setLoadedImage(img);
      URL.revokeObjectURL(tempUrl);
    };
    img.onerror = (err) => {
      logError(`[Preview load] Failed to load preview image from URL`, err);
      URL.revokeObjectURL(tempUrl);
    };
    img.src = tempUrl;
  }, [activeItemId, activeItem?.id]);

  // Synchronous and immediate render on any state update
  useEffect(() => {
    if (!activeItem || !loadedImage || step !== 'edit') return;
    drawCanvasPreview();
  }, [activeItem, loadedImage, step, previewTab]);

  const drawCanvasPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage || !activeItem) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = activeItem.settings;

    // Adjust Canvas bounds
    canvas.width = s.width;
    canvas.height = s.height;

    // Clear
    ctx.clearRect(0, 0, s.width, s.height);

    if (previewTab === 'before') {
      // Render original image scaled cleanly with no adjustments
      drawImageWithSettings(ctx, loadedImage, s.width, s.height, 0, 0);
      return;
    }

    // Draw Background colors
    if (s.bgPreference === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, s.width, s.height);
    } else if (s.bgPreference === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, s.width, s.height);
    }

    // Draw Product Image applying Padding and Rotation parameters
    drawImageWithSettings(ctx, loadedImage, s.width, s.height, s.rotation, s.padding);

    // Draw watermark text if configured
    if (s.watermark.trim()) {
      ctx.save();
      ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
      ctx.font = `bold ${Math.round(s.width * 0.035)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(s.watermark, s.width - (s.width * 0.04), s.height - (s.height * 0.04));
      ctx.restore();
    }
  };

  // Pure mathematical alignment to scale and center rotated items
  const drawImageWithSettings = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    rotation: number,
    paddingPct: number
  ) => {
    ctx.save();

    // Translate to center point for safe rotation
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const isOrtho = rotation === 90 || rotation === 270;
    const paddingMultiplier = 1 - (paddingPct / 100);

    // Swap bounding limits based on rotation alignment
    const limitX = (isOrtho ? canvasHeight : canvasWidth) * paddingMultiplier;
    const limitY = (isOrtho ? canvasWidth : canvasHeight) * paddingMultiplier;

    // Calculate scaling factor
    const scale = Math.min(limitX / img.width, limitY / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  const getDefaultSettings = (presetId: string): ImageSettings => {
    const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    return {
      width: preset.id === 'custom' ? customWidth : preset.width,
      height: preset.id === 'custom' ? customHeight : preset.height,
      bgPreference: preset.id === 'custom' ? customBg : preset.bgPreference,
      format: preset.id === 'custom' ? customFormat : preset.format,
      quality: customQuality,
      rotation: customRotation,
      watermark: watermarkText,
      padding: paddingPct
    };
  };

  const handleFileSelect = (files: File[]) => {
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      setError('Please select valid image files (PNG, JPG, JPEG, WebP).');
      return;
    }

    const activePlan = usePlanStore.getState().activePlan;
    const limit = activePlan === 'premium' ? 100 : 5;
    if (validImages.length > limit) {
      if (activePlan !== 'premium') {
        setError(`The Free plan allows batching up to 5 images. Upgrade to Premium for up to 100 images!`);
        setShowUpgradeModal(true);
      } else {
        setError(`Maximum batch size is 100 images.`);
      }
      return;
    }

    const initialSettings = getDefaultSettings(selectedPresetId);

    const items: BatchItem[] = validImages.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      status: 'idle',
      progress: 0,
      settings: { ...initialSettings }
    }));

    setBatch(prev => {
      const updated = [...prev, ...items];
      if (updated.length > 0) {
        setActiveItemId(updated[0].id);
      }
      return updated;
    });

    setError(undefined);
    setZipDownloadUrl(null);
    setStep('edit'); // Switch to visual workspace editor!
  };

  // Perform processing and return finalized output blob
  const renderItemToBlob = (item: BatchItem): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      log(`[Batch render] Loading image for item ID: ${item.id}, file name: ${item.file.name}`);
      const tempUrl = URL.createObjectURL(item.file);
      const img = new Image();
      img.onload = () => {
        log(`[Batch render] Loaded image successfully. Size: ${img.width}x${img.height}. Starting canvas paint...`);
        try {
          const canvas = document.createElement('canvas');
          const s = item.settings;
          canvas.width = s.width;
          canvas.height = s.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            logError('[Batch render] Failed to initialize 2D canvas context');
            URL.revokeObjectURL(tempUrl);
            reject(new Error('Canvas ctx not initialized'));
            return;
          }

          // Fill backdrop
          if (s.bgPreference === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, s.width, s.height);
          } else if (s.bgPreference === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, s.width, s.height);
          }

          // Scale and align product
          drawImageWithSettings(ctx, img, s.width, s.height, s.rotation, s.padding);

          // Render watermark
          if (s.watermark.trim()) {
            ctx.save();
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
            ctx.font = `bold ${Math.round(s.width * 0.035)}px sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(s.watermark, s.width - (s.width * 0.04), s.height - (s.height * 0.04));
            ctx.restore();
          }

          let mime = 'image/png';
          if (s.format === 'jpeg') mime = 'image/jpeg';
          else if (s.format === 'webp') mime = 'image/webp';

          log(`[Batch render] Exporting canvas with mime: ${mime}, quality: ${s.quality}%`);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(tempUrl); // Clean up immediately to free browser memory
            if (blob) {
              log(`[Batch render] Exported canvas to blob successfully! Blob size: ${blob.size} bytes`);
              if (blob.size === 0) {
                reject(new Error('Exported blob size is 0 bytes'));
              } else {
                resolve(blob);
              }
            } else {
              logError('[Batch render] canvas.toBlob returned null!');
              reject(new Error('Canvas export error'));
            }
          }, mime, s.quality / 100);

        } catch (e: any) {
          logError('[Batch render] Error during canvas manipulation:', e);
          URL.revokeObjectURL(tempUrl);
          reject(e);
        }
      };
      img.onerror = (err) => {
        logError(`[Batch render] Failed to load image from raw file blob`, err);
        URL.revokeObjectURL(tempUrl);
        reject(new Error('Failed to load asset source'));
      };
      img.src = tempUrl;
    });
  };

  const updateActiveSettings = (updater: (prev: ImageSettings) => ImageSettings) => {
    if (!activeItemId) return;
    setBatch(prev => prev.map(item => {
      if (item.id === activeItemId) {
        const next = updater(item.settings);
        return { ...item, settings: next };
      }
      return item;
    }));
  };

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = PRESETS.find(pr => pr.id === presetId) || PRESETS[0];
    
    // Apply preset values immediately to active item configuration
    updateActiveSettings(prev => ({
      ...prev,
      width: p.width,
      height: p.height,
      bgPreference: p.bgPreference,
      format: p.format
    }));
  };

  const handleApplyToAll = () => {
    if (!activeItem) return;
    const settingsToCopy = { ...activeItem.settings };
    setBatch(prev => prev.map(item => ({
      ...item,
      settings: { ...settingsToCopy }
    })));

    // Highlight confirmation message on-screen
    setConfirmationMessage(`Settings applied to all ${batch.length} images`);
    setTimeout(() => {
      setConfirmationMessage(null);
    }, 4000);
  };

  const handleRotateActive = () => {
    updateActiveSettings(prev => {
      const nextRot = (prev.rotation + 90) % 360;
      return { ...prev, rotation: nextRot };
    });
  };

  const handleResetActiveImage = () => {
    if (!activeItemId) return;
    setBatch(prev => prev.map(item => {
      if (item.id === activeItemId) {
        return {
          ...item,
          settings: getDefaultSettings('shopify')
        };
      }
      return item;
    }));
    setSelectedPresetId('shopify');
  };

  const removeImage = (id: string) => {
    const item = batch.find(i => i.id === id);
    if (item && item.resultUrl) {
      URL.revokeObjectURL(item.resultUrl);
    }
    const filtered = batch.filter(i => i.id !== id);
    setBatch(filtered);
    if (activeItemId === id && filtered.length > 0) {
      setActiveItemId(filtered[0].id);
    } else if (filtered.length === 0) {
      setStep('upload');
    }
  };

  const handleReset = () => {
    batch.forEach(item => {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setBatch([]);
    setZipDownloadUrl(null);
    setError(undefined);
    setBatchProgress(0);
    setProcessing(false);
    setStep('upload');
  };

  const handleProcessBatch = async () => {
    if (batch.length === 0) return;

    // Verify limit checks
    const canUse = usePlanStore.getState().canUseTool('product-photo-batch');
    if (!canUse) {
      setShowUpgradeModal(true);
      return;
    }

    setProcessing(true);
    setZipDownloadUrl(null);
    setBatchProgress(10);

    try {
      const zip = new JSZip();

      log(`[Batch process] Starting batch compilation for ${batch.length} images...`);
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        setBatch(prev => prev.map(it => it.id === item.id ? { ...it, status: 'rendering', progress: 30 } : it));
        
        try {
          const processedBlob = await renderItemToBlob(item);
          const ext = item.settings.format;
          const indexPrefix = batch.length > 1 ? `_${i + 1}` : '';
          const filename = `${renamePrefix}${indexPrefix}.${ext}`;
          
          log(`[Batch process] Attempting to add file to JSZip. Name: ${filename}, Size: ${processedBlob.size} bytes`);
          zip.file(filename, processedBlob);
          log(`Added: ${filename} ${processedBlob.size}`);

          const resUrl = URL.createObjectURL(processedBlob);
          setBatch(prev => prev.map(it => it.id === item.id ? { 
            ...it, 
            status: 'success', 
            progress: 100, 
            resultBlob: processedBlob,
            resultUrl: resUrl
          } : it));

        } catch (itemErr: any) {
          logError(`Error processing index ${i}:`, itemErr);
          setBatch(prev => prev.map(it => it.id === item.id ? { 
            ...it, 
            status: 'failed', 
            progress: 0,
            error: itemErr?.message || 'Processing error'
          } : it));
        }

        const overallProgress = 10 + Math.round(((i + 1) / batch.length) * 80);
        setBatchProgress(overallProgress);
      }

      setBatchProgress(95);
      log('[Batch process] Generating ZIP archive blob...');
      const content = await zip.generateAsync({ type: 'blob' });
      log(`ZIP size: ${content.size}`);
      
      if (content.size < 100) {
        warn(`[Batch process] Generated ZIP file size is suspiciously small: ${content.size} bytes`);
      }

      const downloadUrl = URL.createObjectURL(content);
      setZipDownloadUrl(downloadUrl);
      
      // Successful export! Consume usage limit.
      usePlanStore.getState().consumeUsage('product-photo-batch');

      setBatchProgress(100);
      setStep('export'); // Transitions to Completed State!

    } catch (err) {
      logError(err);
      setError('An error occurred during zip compilation.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolWrapper tool={tool}>
      <ToolLayout
        toolId={tool?.id}
        title={tool?.name || 'Product Photo Batch'}
        description={tool?.description || ''}
        accept="image/jpeg, image/png, image/webp"
        multiple={true}
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={batchProgress}
        result={undefined} // Keep undefined to prevent ToolLayout success-screen takeover
        error={error}
        onReset={handleReset}
        onProcess={undefined}
      >
        {/* Step progress bar */}
        {batch.length > 0 && (
          <div className="w-full max-w-2xl mx-auto mb-8 bg-card border border-border-color p-4 rounded-2xl flex items-center justify-between shadow-sm">
            {[
              { id: 'edit', label: '1. Edit & Preview' },
              { id: 'export', label: '2. Export Complete' }
            ].map((s) => {
              const active = step === s.id;
              const completed = s.id === 'edit' && step === 'export';
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    active ? 'bg-primary text-primary-foreground scale-110 shadow-sm' : completed ? 'bg-green-500 text-white' : 'bg-muted-bg text-muted-fg'
                  }`}>
                    {completed ? '✓' : s.id === 'edit' ? '1' : '2'}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-foreground font-black' : 'text-muted-fg'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action feedback notification banner */}
        {confirmationMessage && (
          <div className="max-w-2xl mx-auto mb-4 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded-xl border border-green-100 dark:border-green-900/30 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            {confirmationMessage}
          </div>
        )}

        {/* STEP 2: Active Workspace */}
        {step === 'edit' && batch.length > 0 && activeItem && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Queue thumbnails selection */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between border-b border-border-color pb-2">
                  <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider">
                    Batch Queue ({batch.length})
                  </h3>
                  <button 
                    onClick={handleReset}
                    className="text-[10px] text-red-600 hover:text-red-700 font-bold cursor-pointer hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 max-h-[480px] overflow-y-auto pr-1">
                  {batch.map(item => {
                    const isActive = item.id === activeItemId;
                    return (
                      <div
                        key={item.id}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 relative transition-all ${
                          isActive 
                            ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary shadow-sm' 
                            : 'bg-card border-border-color/80 hover:bg-muted-bg/30'
                        }`}
                      >
                        <button
                          onClick={() => setActiveItemId(item.id)}
                          className="flex-1 flex items-center gap-2 min-w-0 text-left"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-color shrink-0 bg-muted-bg flex items-center justify-center">
                            <ThumbnailImage file={item.file} />
                          </div>
                          <div className="min-w-0 flex-1 hidden lg:block">
                            <p className="text-[11px] font-bold text-foreground truncate">{item.file.name}</p>
                            <span className="text-[9px] text-muted-fg block uppercase font-semibold">
                              {item.settings.width}x{item.settings.height}
                            </span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => removeImage(item.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-fg hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE COLUMN: Large Canvas with Before/After Compare */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border-color pb-2">
                  <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider">
                    Interactive Workspace Preview
                  </h3>
                  <div className="flex gap-1.5 bg-muted-bg/30 p-0.5 rounded-lg border border-border-color/60">
                    <button
                      onClick={() => setPreviewTab('after')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${previewTab === 'after' ? 'bg-background text-primary shadow-xs' : 'text-muted-fg hover:text-foreground'}`}
                    >
                      After (Cleaned)
                    </button>
                    <button
                      onClick={() => setPreviewTab('before')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${previewTab === 'before' ? 'bg-background text-primary shadow-xs' : 'text-muted-fg hover:text-foreground'}`}
                    >
                      Before (Raw)
                    </button>
                  </div>
                </div>

                {/* Live Canvas Box with responsive Checkerboard Backdrop */}
                <div className="relative border border-border-color rounded-3xl overflow-hidden bg-muted-bg/10 p-4 flex flex-col items-center justify-center aspect-square max-h-[420px] shadow-inner">
                  {/* Checkerboard Backdrop pattern for transparent crops */}
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,#808080_25%,transparent_25%),linear-gradient(-45deg,#808080_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#808080_75%),linear-gradient(-45deg,transparent_75%,#808080_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,8px_0] pointer-events-none" />
                  
                  <canvas 
                    ref={canvasRef} 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-border-color/40 z-10" 
                  />

                  {previewTab === 'after' && activeItem.settings.rotation > 0 && (
                    <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20">
                      Rotated {activeItem.settings.rotation}°
                    </span>
                  )}
                </div>

                {/* Direct Actions: Rotation and Reset */}
                <div className="flex justify-between items-center gap-3 bg-card p-3 rounded-2xl border border-border-color shadow-sm">
                  <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                    Editing: <span className="font-medium text-muted-fg">{activeItem.file.name}</span>
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRotateActive} 
                      className="text-xs font-bold h-8 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate 90°
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResetActiveImage} 
                      className="text-xs font-bold h-8 text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      Reset Image
                    </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Parameters sidebar configuration */}
              <div className="lg:col-span-4 space-y-6">
                <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider border-b border-border-color pb-2">
                  Parameters Configuration
                </h3>

                {/* Preset List */}
                <div className="bg-card p-4 rounded-2xl border border-border-color space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase">Platform Presets</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESETS.map(preset => {
                      const isActive = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset.id)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isActive
                              ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                              : 'bg-muted-bg/10 border-border-color text-muted-fg hover:bg-muted-bg/30'
                          }`}
                        >
                          <span className="font-extrabold text-[11px] truncate block leading-none">{preset.name}</span>
                          <span className="text-[9px] font-mono mt-1 opacity-80 block">
                            {preset.id === 'custom' ? 'Custom' : `${preset.width}x${preset.height}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizing, Padding, Quality details */}
                <div className="bg-card p-4 rounded-2xl border border-border-color space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase">Fitted Specifications</h4>

                  {selectedPresetId === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pb-2">
                      <div>
                        <label className="text-[10px] text-muted-fg">Width px</label>
                        <input 
                          type="number" 
                          value={activeItem.settings.width} 
                          onChange={(e) => {
                            const val = Math.max(100, parseInt(e.target.value) || 100);
                            setCustomWidth(val);
                            updateActiveSettings(p => ({ ...p, width: val }));
                          }}
                          className="w-full bg-card px-2.5 py-1 rounded-lg border border-border-color text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-fg">Height px</label>
                        <input 
                          type="number" 
                          value={activeItem.settings.height} 
                          onChange={(e) => {
                            const val = Math.max(100, parseInt(e.target.value) || 100);
                            setCustomHeight(val);
                            updateActiveSettings(p => ({ ...p, height: val }));
                          }}
                          className="w-full bg-card px-2.5 py-1 rounded-lg border border-border-color text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Padding slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-fg font-bold">
                      <span>Canvas Inner Padding</span>
                      <span>{activeItem.settings.padding}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="45" step="5" 
                      value={activeItem.settings.padding}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPaddingPct(val);
                        updateActiveSettings(p => ({ ...p, padding: val }));
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>

                  {/* Image quality slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-fg font-bold">
                      <span>Image Quality Slider</span>
                      <span>{activeItem.settings.quality}%</span>
                    </div>
                    <input 
                      type="range" min="40" max="100" step="5" 
                      value={activeItem.settings.quality}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 85;
                        setCustomQuality(val);
                        updateActiveSettings(p => ({ ...p, quality: val }));
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>

                  {/* Background Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-fg font-bold block">Background Fill Preference</span>
                    <div className="grid grid-cols-4 gap-1">
                      {['transparent', 'white', 'black', 'original'].map(b => {
                        const isBgActive = activeItem.settings.bgPreference === b;
                        return (
                          <button
                            key={b}
                            onClick={() => {
                              setCustomBg(b as any);
                              updateActiveSettings(p => ({ ...p, bgPreference: b as any }));
                            }}
                            className={`py-1 rounded border text-[9px] font-bold uppercase ${
                              isBgActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted-bg/30 border-border-color text-muted-fg hover:bg-muted-bg/50'
                            }`}
                          >
                            {b === 'transparent' ? 'Trans' : b}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-fg font-bold block">Export Format Codec</span>
                    <div className="grid grid-cols-3 gap-1">
                      {['png', 'jpeg', 'webp'].map(fmt => {
                        const isFmtActive = activeItem.settings.format === fmt;
                        return (
                          <button
                            key={fmt}
                            onClick={() => {
                              setCustomFormat(fmt as any);
                              updateActiveSettings(p => ({ ...p, format: fmt as any }));
                            }}
                            className={`py-1 rounded border text-[9px] font-bold uppercase ${
                              isFmtActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted-bg/30 border-border-color text-muted-fg hover:bg-muted-bg/50'
                            }`}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Overlaid adornments and watermarks */}
                <div className="bg-card p-4 rounded-2xl border border-border-color space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase">Adornments</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-fg block">Subtle Text Watermark</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MyStore.com" 
                      value={activeItem.settings.watermark} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setWatermarkText(val);
                        updateActiveSettings(p => ({ ...p, watermark: val }));
                      }}
                      className="w-full bg-card px-2.5 py-1.5 rounded-lg border border-border-color text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-fg block">File Renaming Prefix</label>
                    <input 
                      type="text" 
                      placeholder="e.g. catalog_asset" 
                      value={renamePrefix} 
                      onChange={(e) => setRenamePrefix(e.target.value)}
                      className="w-full bg-card px-2.5 py-1.5 rounded-lg border border-border-color text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sidebar override buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleApplyToAll}
                    className="w-full text-xs font-bold py-2.5 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    Apply Settings to All Images
                  </Button>
                </div>
              </div>
            </div>

            {/* Stage Footer submit button */}
            <div className="pt-8 border-t border-border-color flex justify-end">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleProcessBatch}
                className="font-black text-xs h-12 px-8 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
              >
                Proceed & Export Batch
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Export Completed View with visible primary download link */}
        {step === 'export' && zipDownloadUrl && (
          <div className="w-full max-w-xl mx-auto space-y-6 text-center animate-fade-in py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-3xl font-black text-foreground tracking-tight leading-none">Batch Export Complete!</h4>
              <p className="text-sm text-muted-fg leading-relaxed max-w-sm mx-auto">
                Successfully prepared batch ZIP! All uploaded product photos have been compiled locally in your browser memory.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="max-w-xs mx-auto pt-6 space-y-3">
              <a 
                href={zipDownloadUrl} 
                download={`${renamePrefix}_batch_assets.zip`}
                className="block"
              >
                <Button variant="primary" className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all">
                  <FileArchive className="w-5 h-5" />
                  Download Complete ZIP
                </Button>
              </a>

              <Button 
                variant="outline" 
                onClick={handleReset}
                className="w-full h-11 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Start New Batch
              </Button>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
