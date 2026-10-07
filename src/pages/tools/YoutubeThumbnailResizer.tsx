import React, { useState, useEffect, useRef } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { creatorPresets } from '../../data/creatorPresets';
import { Button } from '../../components/ui/Button';
import { usePlanStore } from '../../store/usePlanStore';

export const YoutubeThumbnailResizer = () => {
  const tool = getToolById('youtube-thumbnail-resizer');
  const preset = creatorPresets.youtubeThumbnail;

  const [file, setFile] = useState<File | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    originalSize: number;
    newSize: number;
    downloadUrl: string;
    downloadFilename: string;
    message: string;
  } | undefined>();
  const [error, setError] = useState<string>();

  // Resizer parameters
  const [fitMode, setFitMode] = useState<'fill' | 'fit'>('fill');
  const [position, setPosition] = useState<'center' | 'start' | 'end'>('center');
  const [bgColor, setBgColor] = useState('#000000');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(0.85);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      if (!selected.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setFile(selected);
      setResult(undefined);
      setError(undefined);

      const tempUrl = URL.createObjectURL(selected);
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        URL.revokeObjectURL(tempUrl);
      };
      img.onerror = () => {
        setError('Could not load this image. It might be corrupted.');
        URL.revokeObjectURL(tempUrl);
      };
      img.src = tempUrl;
    }
  };

  const handleReset = () => {
    setFile(null);
    setLoadedImage(null);
    setResult(undefined);
    setError(undefined);
  };

  // Live preview rendering effect mirroring ProductPhotoBatch
  useEffect(() => {
    if (!loadedImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tWidth = preset.width;
    const tHeight = preset.height;
    canvas.width = tWidth;
    canvas.height = tHeight;

    // Clear background
    ctx.fillStyle = fitMode === 'fit' ? bgColor : '#000000';
    ctx.fillRect(0, tWidth === tHeight ? 0 : 0, tWidth, tHeight); // simplified fill

    const sWidth = loadedImage.width;
    const sHeight = loadedImage.height;
    const sAspect = sWidth / sHeight;
    const tAspect = tWidth / tHeight;

    let dx = 0, dy = 0, dWidth = tWidth, dHeight = tHeight;

    if (fitMode === 'fill') {
      if (sAspect > tAspect) {
        const scale = tHeight / sHeight;
        const scaledWidth = sWidth * scale;
        dWidth = scaledWidth;
        dy = 0;
        if (position === 'center') dx = (tWidth - scaledWidth) / 2;
        else if (position === 'start') dx = 0;
        else if (position === 'end') dx = tWidth - scaledWidth;
      } else {
        const scale = tWidth / sWidth;
        const scaledHeight = sHeight * scale;
        dHeight = scaledHeight;
        dx = 0;
        if (position === 'center') dy = (tHeight - scaledHeight) / 2;
        else if (position === 'start') dy = 0;
        else if (position === 'end') dy = tHeight - scaledHeight;
      }
    } else {
      if (sAspect > tAspect) {
        const scale = tWidth / sWidth;
        const scaledHeight = sHeight * scale;
        dHeight = scaledHeight;
        dx = 0;
        if (position === 'center') dy = (tHeight - scaledHeight) / 2;
        else if (position === 'start') dy = 0;
        else if (position === 'end') dy = tHeight - scaledHeight;
      } else {
        const scale = tHeight / sHeight;
        const scaledWidth = sWidth * scale;
        dWidth = scaledWidth;
        dy = 0;
        if (position === 'center') dx = (tWidth - scaledWidth) / 2;
        else if (position === 'start') dx = 0;
        else if (position === 'end') dx = tWidth - scaledWidth;
      }
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, tWidth, tHeight);
    ctx.drawImage(loadedImage, dx, dy, dWidth, dHeight);
  }, [loadedImage, fitMode, position, bgColor, preset]);

  const handleProcess = async () => {
    if (!file || !canvasRef.current) return;

    // Check if user has uses remaining before processing
    const canUse = usePlanStore.getState().canUseTool('youtube-thumbnail-resizer');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }

    setProcessing(true);
    setError(undefined);

    try {
      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Could not produce image blob.');
        const downloadUrl = URL.createObjectURL(blob);
        const formatExt = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

        setResult({
          originalSize: file.size,
          newSize: blob.size,
          downloadUrl,
          downloadFilename: `youtube_thumbnail_${Date.now()}.${formatExt}`,
          message: `Successfully resized and optimized image to ${preset.width}x${preset.height} YouTube Thumbnail standard.`
        });

        // Consume usage only after successful thumbnail processing
        usePlanStore.getState().consumeUsage('youtube-thumbnail-resizer');

        setProcessing(false);
      }, format, quality);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong during thumbnail scaling.');
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
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={file && !result ? handleProcess : undefined}
      >
        {file && (
          <div className="space-y-6">
            <div className="w-full max-w-lg mx-auto aspect-video rounded-2xl overflow-hidden border border-border-color bg-card shadow-inner flex items-center justify-center relative">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between bg-muted-bg/30 p-4 rounded-2xl gap-3 text-sm text-foreground">
              <div>
                <span className="font-semibold block mb-0.5">Original File</span>
                <span className="text-muted-fg">{file.name}</span>
              </div>
              <div className="sm:text-right">
                <span className="font-semibold block mb-0.5">Dimensions</span>
                <span className="text-muted-fg">{loadedImage ? `${loadedImage.width} × ${loadedImage.height} pixels` : 'Loading...'}</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Fitting Options */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-fg tracking-wider">Fitting Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFitMode('fill')}
                    className={`p-3.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      fitMode === 'fill' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Crop & Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitMode('fit')}
                    className={`p-3.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      fitMode === 'fit' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Fit & Pad (Border)
                  </button>
                </div>
              </div>

              {/* Crop Positioning */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-fg tracking-wider">Alignment / Crop Focus</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosition('start')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      position === 'start' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Top / Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('center')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      position === 'center' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('end')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      position === 'end' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Bottom / Right
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Background / Padding Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 border-0 rounded-lg overflow-hidden cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="#000000"
                  className="p-2.5 rounded-lg border border-border-color bg-background text-foreground w-32 font-mono text-sm"
                />
                <button type="button" onClick={() => setBgColor('#000000')} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg">Black</button>
                <button type="button" onClick={() => setBgColor('#ffffff')} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg">White</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border-color">
              {/* Output format selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-medium outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="image/jpeg">JPEG (Recommended)</option>
                  <option value="image/webp">WebP (Highly Optimized)</option>
                  <option value="image/png">PNG (Lossless / High Res)</option>
                </select>
              </div>

              {/* Quality Selection */}
              {format !== 'image/png' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <label className="font-semibold text-muted-fg uppercase tracking-wider">Compression Quality</label>
                    <span className="font-semibold text-primary-600">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-primary-600 mt-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};

