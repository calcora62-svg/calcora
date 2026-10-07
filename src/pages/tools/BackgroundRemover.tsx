import React, { useState, useRef, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { Button } from '../../components/ui/Button';
import { Download, RefreshCw, X } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';

// Helper to auto-resize large images on mobile to max 1024px
const checkAndResizeImage = (file: File): Promise<{ processedFile: File; resized: boolean }> => {
  return new Promise((resolve) => {
    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
    if (!isMob) {
      resolve({ processedFile: file, resized: false });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (width > 1024 || height > 1024) {
        let newWidth = width;
        let newHeight = height;

        if (width >= height) {
          newWidth = 1024;
          newHeight = Math.round((height * 1024) / width);
        } else {
          newHeight = 1024;
          newWidth = Math.round((width * 1024) / height);
        }

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ processedFile: file, resized: false });
          return;
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const mimeType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve({ processedFile: resizedFile, resized: true });
            } else {
              resolve({ processedFile: file, resized: false });
            }
          },
          mimeType,
          0.92
        );
      } else {
        resolve({ processedFile: file, resized: false });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ processedFile: file, resized: false });
    };

    img.src = objectUrl;
  });
};

export const BackgroundRemover = () => {
  const tool = getToolById('background-remover');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('Loading AI model...');
  const [error, setError] = useState<string>();
  const [isAutoResized, setIsAutoResized] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [originalUrl, setOriginalUrl] = useState<string>();
  const [resultUrl, setResultUrl] = useState<string>();
  const [result, setResult] = useState<{ message: string } | undefined>();
  
  const [bgColor, setBgColor] = useState<string>('transparent');
  
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use refs to track URLs, revoke only on unmount or new file
  const originalUrlRef = useRef<string | undefined>(undefined);
  const resultUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    originalUrlRef.current = originalUrl;
  }, [originalUrl]);

  useEffect(() => {
    resultUrlRef.current = resultUrl;
  }, [resultUrl]);

  // Cleanup ONLY on unmount
  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const handleFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      if (!selected.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      // Revoke previous URLs when new file selected
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      
      setResultUrl(undefined);
      setResult(undefined);
      setError(undefined);

      const isMob = typeof window !== 'undefined' && window.innerWidth < 768;

      // On mobile, if file is ~5MB or greater, warn immediately to prevent browser memory crashes
      if (isMob && selected.size > 4 * 1024 * 1024) {
        setFile(selected);
        setOriginalUrl(URL.createObjectURL(selected));
        setIsAutoResized(false);
        setError("Mobile memory is limited. Try a smaller image (under 1MB) or use desktop for best results.");
        return;
      }

      // Check and auto-resize if on mobile and dimensions > 1024px
      const { processedFile, resized } = await checkAndResizeImage(selected);
      setFile(processedFile);
      setIsAutoResized(resized);
      setOriginalUrl(URL.createObjectURL(processedFile));
    }
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(undefined);
    setResult(undefined);
    setOriginalUrl(undefined);
    setError(undefined);
    setProgress(0);
    setProgressMessage('Loading AI model...');
    setIsAutoResized(false);
    setBgColor('transparent');
    setSliderPos(50);
  };

  const handleProcess = async () => {
    if (!file) return;

    const canUse = usePlanStore.getState().canUseTool('background-remover');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }

    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;

    // Mobile file size guard: files >= 4MB run out of memory on mobile WebAssembly
    if (isMob && file.size > 4 * 1024 * 1024) {
      setError("Mobile memory is limited. Try a smaller image (under 1MB) or use desktop for best results.");
      return;
    }
    
    setProcessing(true);
    setError(undefined);
    setProgress(5);
    setProgressMessage("Loading AI model...");

    let fileToProcess = file;

    // Ensure image is resized on mobile if not done yet
    if (isMob && !isAutoResized) {
      const { processedFile, resized } = await checkAndResizeImage(file);
      fileToProcess = processedFile;
      if (resized) {
        setIsAutoResized(true);
      }
    }

    // FIX 2: 60-second timeout handling
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout: Background removal took longer than 60 seconds"));
      }, 60000);
    });

    // FIX 5: Progress indicator: "Loading AI model..." -> "Processing image..." -> "Almost done..."
    const startTime = Date.now();
    const estimatedDuration = isMob ? 35000 : 20000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const estimated = Math.min(90, 5 + (elapsed / estimatedDuration) * 85);
      const rounded = Math.round(estimated);
      setProgress(rounded);

      if (rounded < 35) {
        setProgressMessage("Loading AI model...");
      } else if (rounded < 80) {
        setProgressMessage("Processing image...");
      } else {
        setProgressMessage("Almost done...");
      }
    }, 400);
    
    try {
      const module = await import('@imgly/background-removal');
      const removeBackground = module.removeBackground;

      const config: any = {
        progress: (key: string) => {
          if (key.includes('fetch') || key.includes('model')) {
            setProgressMessage("Loading AI model...");
          } else if (key.includes('compute:inference') || key.includes('inference')) {
            setProgressMessage("Processing image...");
          } else if (key.includes('mask') || key.includes('encode')) {
            setProgressMessage("Almost done...");
          }
        }
      };

      // FIX 2: Use smallest quantized model on mobile
      if (isMob) {
        config.model = 'isnet_quint8';
      }

      const imageBlob = await Promise.race([
        removeBackground(fileToProcess, config),
        timeoutPromise
      ]);
      
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(progressInterval);
      
      if (!imageBlob || imageBlob.size === 0) {
        throw new Error("Empty result");
      }
      
      setProgressMessage("Almost done...");
      setProgress(100);
      const url = URL.createObjectURL(imageBlob);
      setResultUrl(url);
      setResult({ message: 'Successfully removed background!' });

      usePlanStore.getState().consumeUsage('background-remover');
      
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(progressInterval);
      console.error('Background removal error:', err);

      // FIX 3: Better error message on mobile
      if (isMob) {
        setError("Mobile memory is limited. Try a smaller image (under 1MB) or use desktop for best results.");
      } else {
        setError('Failed to remove background. The image might be too large or complex.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    
    if (bgColor === 'transparent') {
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = `nobg_${file?.name || 'image.png'}`;
      a.click();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bg_${file?.name || 'image.png'}`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };
    img.src = resultUrl;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    let clientX = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  if (!tool) return null;
  
  const customResultNode = (
    <div className="space-y-8 w-full">
      <h3 className="text-xl font-bold text-foreground text-center">Preview & Adjust</h3>
      
      <div 
        ref={sliderRef}
        className="relative w-full max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden cursor-ew-resize bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2Q0ZDRkOCIgLz4KPHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2UyZTJlNCIgLz4KPHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2UyZTJlNCIgLz4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkNGQ0ZDgiIC8+Cjwvc3ZnPg==')] shadow-inner"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleMouseMove}
      >
        {/* After image (with optional bg color) */}
        <div 
          className="absolute inset-0 w-full h-full object-contain transition-colors"
          style={{ backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor }}
        >
          {resultUrl && <img src={resultUrl} alt="After" className="w-full h-full object-contain pointer-events-none" />}
        </div>
        
        {/* Before image (clipped) */}
        {originalUrl && (
          <div 
            className="absolute inset-0 w-full h-full bg-black/5"
            style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
          >
            <img src={originalUrl} alt="Before" className="w-full h-full object-contain pointer-events-none" />
          </div>
        )}
        
        {/* Slider handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center z-10"
          style={{ left: `calc(${sliderPos}% - 2px)` }}
        >
          <div className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center">
            <div className="w-1 h-3 bg-gray-300 rounded-full flex gap-1"></div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => setBgColor('transparent')}
          className={`px-4 py-2 rounded-lg border font-medium ${bgColor === 'transparent' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-border-color bg-card'}`}
        >
          Transparent
        </button>
        <button 
          onClick={() => setBgColor('#ffffff')}
          className={`px-4 py-2 rounded-lg border font-medium ${bgColor === '#ffffff' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-border-color bg-card'}`}
        >
          White Background
        </button>
        <button 
          onClick={() => setBgColor('#000000')}
          className={`px-4 py-2 rounded-lg border font-medium ${bgColor === '#000000' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-border-color bg-card'}`}
        >
          Black Background
        </button>
      </div>
      
      <div className="flex justify-center mt-6">
        <Button variant="primary" onClick={downloadResult} size="lg">
          <Download className="w-5 h-5 mr-2" />
          Download Final Image
        </Button>
      </div>
    </div>
  );

  return (
    <ToolWrapper tool={tool}>
      {/* FIX 4: Mobile warning banner */}
      {isMobile && !bannerDismissed && !processing && !resultUrl && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base leading-none text-amber-700 dark:text-amber-400">ⓘ</span>
            <span>Mobile: Processing may take 30-60 seconds. For best results, use desktop.</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg text-amber-700 dark:text-amber-300 transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ToolLayout
        toolId={tool.id}
        title={tool.name}
        description={tool.description}
        accept="image/*"
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={progress}
        processingMessage={progressMessage}
        error={error}
        result={result}
        resultNode={customResultNode}
        onReset={handleReset}
        onProcess={file && !resultUrl ? handleProcess : undefined}
        onTryAgain={file ? handleProcess : undefined}
      >
        {file && !resultUrl && (
          <div className="space-y-6 text-center py-4">
            <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground inline-block mb-2">
              <span className="font-semibold block">{file.name}</span>
            </div>

            {/* FIX 1: Small note to user when auto-resized on mobile */}
            {isAutoResized && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-900/40 mx-auto w-fit">
                <span>Image auto-resized for mobile</span>
              </div>
            )}

            {/* FIX 3: Recovery note & actions on mobile */}
            {error && isMobile && (
              <div className="p-4 bg-muted-bg/60 border border-border-color rounded-2xl text-left space-y-3 mt-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Notice</span>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full">
                    💡 Use Desktop Instead
                  </span>
                </div>
                <p className="text-xs text-muted-fg leading-relaxed">
                  Mobile devices have limited browser memory. For best results and large files, use desktop for full performance.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button variant="primary" size="sm" onClick={handleProcess}>
                    Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Try Another Image
                  </Button>
                </div>
              </div>
            )}

            {!error && (
              <p className="text-muted-fg text-sm">
                We will use a secure, local AI model to remove the background in your browser. 
                First-time loading may take a few seconds.
              </p>
            )}
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};