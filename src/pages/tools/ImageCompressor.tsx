import React, { useState } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';
import { log, warn, error } from '../../utils/logger';

export const ImageCompressor = () => {
  const tool = getToolById('image-compressor');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    originalSize: number;
    newSize: number;
    savedPercentage: number;
    downloadUrl: string;
    downloadFilename: string;
  } | undefined>();
  const [error, setError] = useState<string>();

  const [quality, setQuality] = useState(0.8);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }
      setFile(files[0]);
      setError(undefined);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(undefined);
    setError(undefined);
    setProgress(0);
  };

  // FALLBACK: Canvas-based compression if library fails
  const compressWithCanvas = async (inputFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(inputFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        
        // Resize if larger than maxWidthOrHeight
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          const ratio = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        
        // White background for transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const outputFile = new File([blob], inputFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(outputFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  };

  const handleProcess = async () => {
    if (!file) return;

    const canUse = usePlanStore.getState().canUseTool('image-compressor');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }

    setProcessing(true);
    setError(undefined);
    setProgress(10);
    
    try {
      let compressedFile: File;

      try {
        // Try browser-image-compression first (WITHOUT Web Worker to avoid hang)
        const imageCompressionModule = await import('browser-image-compression');
        const imageCompression = imageCompressionModule.default;
        
        const options = {
          maxSizeMB: 5,
          maxWidthOrHeight,
          useWebWorker: false,  // FIX: Web Worker disabled to prevent hang
          initialQuality: quality,
          onProgress: (p: number) => setProgress(Math.min(90, Math.round(p * 100)))
        };

        // Timeout safety: if library takes more than 30s, fall back to canvas
        const compressed = await Promise.race([
          imageCompression(file, options),
          new Promise<File>((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 30000)
          )
        ]);
        compressedFile = compressed;
        log('[ImageCompressor] Library compression succeeded');
      } catch (libErr) {
        warn('[ImageCompressor] Library failed, using Canvas fallback:', libErr);
        // Fallback to Canvas-based compression
        compressedFile = await compressWithCanvas(file);
        log('[ImageCompressor] Canvas fallback succeeded');
      }
      
      setProgress(100);
      
      const downloadUrl = URL.createObjectURL(compressedFile);
      const savedPercentage = Math.round((1 - compressedFile.size / file.size) * 100);
      
      setResult({
        originalSize: file.size,
        newSize: compressedFile.size,
        savedPercentage: savedPercentage > 0 ? savedPercentage : 0,
        downloadUrl,
        downloadFilename: `compressed_${file.name}`
      });

      usePlanStore.getState().consumeUsage('image-compressor');
      
    } catch (err) {
      console.error('[ImageCompressor] Total failure:', err);
      setError('Something went wrong while processing this file. Please try a smaller image.');
    } finally {
      setProcessing(false);
    }
  };

  if (!tool) return null;

  return (
    <ToolWrapper tool={tool}>
      <ToolLayout
        toolId={tool.id}
        title={tool.name}
        description={tool.description}
        accept="image/jpeg, image/png, image/webp"
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={progress}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={file && !result ? handleProcess : undefined}
      >
        {file && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-muted-bg rounded-lg">
                <span className="font-semibold text-foreground">{file.name}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="font-medium text-foreground">Quality</label>
                <span className="text-muted-fg">{Math.round(quality * 100)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="1" step="0.1" 
                value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <label className="font-medium text-foreground">Max Width/Height</label>
                <span className="text-muted-fg">{maxWidthOrHeight}px</span>
              </div>
              <input 
                type="range" min="500" max="4000" step="100" 
                value={maxWidthOrHeight} onChange={(e) => setMaxWidthOrHeight(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};