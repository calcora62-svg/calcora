import React, { useState, useEffect, useRef } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { creatorPresets } from '../../data/creatorPresets';

export const InstagramStoryResizer = () => {
  const tool = getToolById('instagram-story-resizer');
  const preset = creatorPresets.instagramStory;

  const [file, setFile] = useState<File | null>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    originalSize: number;
    newSize: number;
    downloadUrl: string;
    downloadFilename: string;
    message: string;
  } | undefined>();
  const [error, setError] = useState<string>();

  // Parameters
  const [fitMode, setFitMode] = useState<'fill' | 'fit'>('fill');
  const [position, setPosition] = useState<'center' | 'start' | 'end'>('center');
  const [bgColor, setBgColor] = useState('#0d0d0d');
  const [showSafeArea, setShowSafeArea] = useState(true);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      if (!selected.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setFile(selected);
      setError(undefined);

      const img = new Image();
      img.onload = () => {
        setImgObj(img);
      };
      img.onerror = () => {
        setError('Could not load image file.');
      };
      img.src = URL.createObjectURL(selected);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImgObj(null);
    setResult(undefined);
    setError(undefined);
  };

  // Draw interactive preview canvas with safe areas
  useEffect(() => {
    if (!imgObj || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed preview dims matching 9:16
    const pW = 225;
    const pH = 400;
    canvas.width = pW;
    canvas.height = pH;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, pW, pH);

    const sWidth = imgObj.width;
    const sHeight = imgObj.height;
    const sAspect = sWidth / sHeight;
    const tAspect = pW / pH;

    let dx = 0, dy = 0, dWidth = pW, dHeight = pH;

    if (fitMode === 'fill') {
      if (sAspect > tAspect) {
        const scale = pH / sHeight;
        const scaledWidth = sWidth * scale;
        dWidth = scaledWidth;
        dy = 0;
        if (position === 'center') dx = (pW - scaledWidth) / 2;
        else if (position === 'start') dx = 0;
        else if (position === 'end') dx = pW - scaledWidth;
      } else {
        const scale = pW / sWidth;
        const scaledHeight = sHeight * scale;
        dHeight = scaledHeight;
        dx = 0;
        if (position === 'center') dy = (pH - scaledHeight) / 2;
        else if (position === 'start') dy = 0;
        else if (position === 'end') dy = pH - scaledHeight;
      }
    } else {
      if (sAspect > tAspect) {
        const scale = pW / sWidth;
        const scaledHeight = sHeight * scale;
        dHeight = scaledHeight;
        dx = 0;
        if (position === 'center') dy = (pH - scaledHeight) / 2;
        else if (position === 'start') dy = 0;
        else if (position === 'end') dy = pH - scaledHeight;
      } else {
        const scale = pH / sHeight;
        const scaledWidth = sWidth * scale;
        dWidth = scaledWidth;
        dy = 0;
        if (position === 'center') dx = (pW - scaledWidth) / 2;
        else if (position === 'start') dx = 0;
        else if (position === 'end') dx = pW - scaledWidth;
      }
    }

    ctx.drawImage(imgObj, dx, dy, dWidth, dHeight);

    // Draw IG Story Safe Area overlay bounds
    if (showSafeArea) {
      // Top 50px (approx 12%) and bottom 60px (approx 15%) are obscured by IG Header & Footer
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // translucent red for danger zones

      // Top safe area boundary
      ctx.fillRect(0, 0, pW, 50);
      // Bottom safe area boundary
      ctx.fillRect(0, pH - 65, pW, 65);

      // Label Overlay
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('TOP IG HEADER DANGER', 8, 28);
      ctx.fillText('BOTTOM REPLY BAR DANGER', 8, pH - 24);
    }

  }, [imgObj, fitMode, position, bgColor, showSafeArea]);

  const handleProcess = async () => {
    if (!file || !imgObj) return;
    setProcessing(true);
    setError(undefined);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, preset.width, preset.height);

      const sWidth = imgObj.width;
      const sHeight = imgObj.height;
      const sAspect = sWidth / sHeight;
      const tWidth = preset.width;
      const tHeight = preset.height;
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

      ctx.drawImage(imgObj, dx, dy, dWidth, dHeight);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Could not produce image blob.');
        const downloadUrl = URL.createObjectURL(blob);
        setResult({
          originalSize: file.size,
          newSize: blob.size,
          downloadUrl,
          downloadFilename: `instagram_story_${Date.now()}.jpg`,
          message: `Successfully scaled image to 1080x1920 Instagram Story standard dimensions.`
        });
        setProcessing(false);
      }, 'image/jpeg', 0.9);

    } catch (err: any) {
      console.error(err);
      setError('Error scaling image to 9:16 aspect ratio.');
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
        {file && imgObj && (
          <div className="space-y-6">
            {/* Real-time Visualization Preview Panel */}
            <div className="flex flex-col items-center bg-muted-bg/30 p-6 rounded-2xl">
              <h4 className="text-xs font-bold text-muted-fg uppercase tracking-wider mb-4">Instagram Story Visual Grid Guide</h4>
              <div className="bg-card p-4 rounded-xl border border-border-color shadow-sm flex flex-col items-center justify-center min-h-[440px] w-full max-w-sm overflow-hidden">
                <canvas ref={previewCanvasRef} className="max-w-full max-h-[400px] object-contain shadow-md rounded-2xl border border-border-color" />
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="showSafe"
                    checked={showSafeArea}
                    onChange={(e) => setShowSafeArea(e.target.checked)}
                    className="w-4 h-4 accent-primary-600 rounded"
                  />
                  <label htmlFor="showSafe" className="text-xs font-bold text-foreground cursor-pointer">
                    Highlight Obscured Danger Areas
                  </label>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-2">
              {/* Fitting Mode */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Fitting Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFitMode('fill')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      fitMode === 'fill' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Crop & Fill (Full 9:16)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitMode('fit')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      fitMode === 'fit' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Fit & Pad (Border)
                  </button>
                </div>
              </div>

              {/* Crop focus alignment */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Crop Alignment</label>
                <div className="grid grid-cols-3 gap-2">
                  {['start', 'center', 'end'].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos as any)}
                      className={`p-2 rounded-lg border text-xs font-bold transition-all capitalize ${
                        position === pos ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                      }`}
                    >
                      {pos === 'start' ? 'Top/Left' : pos === 'center' ? 'Center' : 'Bottom/Right'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {fitMode === 'fit' && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Border Background Color</label>
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
                    placeholder="#0d0d0d"
                    className="p-2.5 rounded-lg border border-border-color bg-background text-foreground w-32 font-mono text-sm"
                  />
                  <button type="button" onClick={() => setBgColor('#0d0d0d')} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg">Dark Grey</button>
                  <button type="button" onClick={() => setBgColor('#ffffff')} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg">White</button>
                </div>
              </div>
            )}
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
