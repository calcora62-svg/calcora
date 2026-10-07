import React, { useState, useRef, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { Button } from '../../components/ui/Button';
import { Download, RefreshCw } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore';

export const BackgroundRemover = () => {
  const tool = getToolById('background-remover');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  
  const [originalUrl, setOriginalUrl] = useState<string>();
  const [resultUrl, setResultUrl] = useState<string>();
  const [result, setResult] = useState<{ message: string } | undefined>();
  
  const [bgColor, setBgColor] = useState<string>('transparent');
  
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // FIX 1: Use refs to track URLs, revoke only on unmount or new file
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

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      // Revoke previous URLs when new file selected
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      
      setFile(files[0]);
      setOriginalUrl(URL.createObjectURL(files[0]));
      setResultUrl(undefined);
      setResult(undefined);
      setError(undefined);
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
    
    setProcessing(true);
    setError(undefined);
    setProgress(5);
    
    try {
      const module = await import('@imgly/background-removal');
      const removeBackground = module.removeBackground;

      // FIX 2: Smoother progress — use indeterminate-ish increments
      // Instead of relying on weird current/total, use time-based estimate
      const startTime = Date.now();
      const estimatedDuration = 20000; // 20 seconds estimated
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const estimated = Math.min(85, 5 + (elapsed / estimatedDuration) * 80);
        setProgress(Math.round(estimated));
      }, 500);

      const config = {
        progress: (key: string, current: number, total: number) => {
          // Library progress is unreliable — skip, use time-based instead
        }
      };

      const imageBlob = await removeBackground(file, config);
      
      clearInterval(progressInterval);
      
      if (imageBlob.size === 0) throw new Error("Empty result");
      
      setProgress(100);
      const url = URL.createObjectURL(imageBlob);
      setResultUrl(url);
      setResult({ message: 'Successfully removed background!' });

      usePlanStore.getState().consumeUsage('background-remover');
      
    } catch (err) {
      console.error(err);
      setError('Failed to remove background. The image might be too large or complex.');
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
        
        {/* Before image (clipped) — FIX: Ensure originalUrl exists and is not revoked */}
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
      <ToolLayout
        toolId={tool.id}
        title={tool.name}
        description={tool.description}
        accept="image/*"
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={progress}
        error={error}
        result={result}
        resultNode={customResultNode}
        onReset={handleReset}
        onProcess={file && !resultUrl ? handleProcess : undefined}
      >
        {file && !resultUrl && (
          <div className="space-y-6 text-center py-4">
            <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground inline-block mb-4">
              <span className="font-semibold block">{file.name}</span>
            </div>
            <p className="text-muted-fg text-sm">
              We will use a secure, local AI model to remove the background in your browser. 
              First-time loading may take a few seconds.
            </p>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};