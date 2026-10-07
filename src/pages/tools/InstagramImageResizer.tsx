import React, { useState, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { creatorPresets, CreatorPreset } from '../../data/creatorPresets';

export const InstagramImageResizer = () => {
  const tool = getToolById('instagram-image-resizer');

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

  // Instagram presets
  const presets: Record<string, CreatorPreset> = {
    square: creatorPresets.instagramSquare,
    portrait: creatorPresets.instagramPortrait,
    landscape: creatorPresets.instagramLandscape
  };

  const [selectedPresetId, setSelectedPresetId] = useState<'square' | 'portrait' | 'landscape'>('square');
  const [fitMode, setFitMode] = useState<'fill' | 'fit'>('fill');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(0.85);

  const activePreset = presets[selectedPresetId];

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      if (!selected.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setFile(selected);
      setError(undefined);

      const img = new Image();
      img.onload = () => {
        setImgObj(img);
      };
      img.onerror = () => {
        setError('Failed to load image file.');
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

  const handleProcess = async () => {
    if (!file || !imgObj) return;
    setProcessing(true);
    setError(undefined);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = activePreset.width;
      canvas.height = activePreset.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas rendering context not supported');

      // Paint canvas background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, activePreset.width, activePreset.height);

      const sWidth = imgObj.width;
      const sHeight = imgObj.height;
      const sAspect = sWidth / sHeight;
      const tWidth = activePreset.width;
      const tHeight = activePreset.height;
      const tAspect = tWidth / tHeight;

      let dx = 0, dy = 0, dWidth = tWidth, dHeight = tHeight;

      if (fitMode === 'fill') {
        if (sAspect > tAspect) {
          const scale = tHeight / sHeight;
          const scaledWidth = sWidth * scale;
          dWidth = scaledWidth;
          dx = (tWidth - scaledWidth) / 2;
          dy = 0;
        } else {
          const scale = tWidth / sWidth;
          const scaledHeight = sHeight * scale;
          dHeight = scaledHeight;
          dx = 0;
          dy = (tHeight - scaledHeight) / 2;
        }
      } else {
        if (sAspect > tAspect) {
          const scale = tWidth / sWidth;
          const scaledHeight = sHeight * scale;
          dHeight = scaledHeight;
          dx = 0;
          dy = (tHeight - scaledHeight) / 2;
        } else {
          const scale = tHeight / sHeight;
          const scaledWidth = sWidth * scale;
          dWidth = scaledWidth;
          dx = (tWidth - scaledWidth) / 2;
          dy = 0;
        }
      }

      ctx.drawImage(imgObj, dx, dy, dWidth, dHeight);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Could not produce image blob.');
        const downloadUrl = URL.createObjectURL(blob);
        const formatExt = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

        setResult({
          originalSize: file.size,
          newSize: blob.size,
          downloadUrl,
          downloadFilename: `instagram_${selectedPresetId}_${Date.now()}.${formatExt}`,
          message: `Your image was successfully resized to ${activePreset.width}x${activePreset.height} pixels.`
        });
        setProcessing(false);
      }, format, quality);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error scaling image.');
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
            <div className="flex flex-col sm:flex-row justify-between bg-muted-bg/30 p-4 rounded-2xl gap-3 text-sm">
              <div>
                <span className="font-semibold block mb-0.5">Uploaded Image</span>
                <span className="text-muted-fg">{file.name}</span>
              </div>
              <div className="sm:text-right">
                <span className="font-semibold block mb-0.5">Original Dimensions</span>
                <span className="text-muted-fg">{imgObj.width} × {imgObj.height} px</span>
              </div>
            </div>

            {/* Selection Grid for Instagram Posts */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Instagram Format</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(presets).map((key) => {
                  const p = presets[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPresetId(key as any)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedPresetId === key ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                      }`}
                    >
                      <span className="block font-bold text-sm capitalize">{key}</span>
                      <span className="text-[11px] text-muted-fg font-medium block mt-1">{p.width} × {p.height}</span>
                      <span className="text-[10px] text-primary-500 font-bold block mt-0.5">({p.aspectRatio})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-2">
              {/* Fit Mode */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Fitting Style</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFitMode('fill')}
                    className={`p-3.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      fitMode === 'fill' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                    }`}
                  >
                    Crop & Fill (Full)
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

              {/* Background Color Picker for border */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Border Background</label>
                {fitMode === 'fit' ? (
                  <div className="flex items-center gap-3 h-[52px]">
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
                      placeholder="#ffffff"
                      className="p-2.5 rounded-lg border border-border-color bg-background text-foreground w-32 font-mono text-sm"
                    />
                    <button type="button" onClick={() => setBgColor('#ffffff')} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg">White</button>
                    <button type="button" onClick={() => setBgColor('#000000')} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg">Black</button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-fg/80 pt-3">Image will fill the aspect ratio entirely, clipping boundaries. Color padding disabled.</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border-color">
              {/* Output Format */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-medium outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="image/jpeg">JPEG (Standard quality)</option>
                  <option value="image/webp">WebP (High performance)</option>
                  <option value="image/png">PNG (Lossless copy)</option>
                </select>
              </div>

              {/* Compression Slider */}
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
