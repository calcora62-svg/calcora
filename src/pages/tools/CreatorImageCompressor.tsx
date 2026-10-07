import React, { useState } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';

export const CreatorImageCompressor = () => {
  const tool = getToolById('creator-image-compressor');

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    originalSize: number;
    newSize: number;
    savedPercentage: number;
    downloadUrl: string;
    downloadFilename: string;
    message: string;
  } | undefined>();
  const [error, setError] = useState<string>();

  // Compressor Parameters
  const [platformPreset, setPlatformPreset] = useState<string>('youtube'); // 'youtube' | 'discord' | 'email' | 'custom'
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('image/')) {
        setError('Please select a valid image file.');
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

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(undefined);
    setProgress(15);

    try {
      const imageCompressionModule = await import('browser-image-compression');
      const imageCompression = imageCompressionModule.default;

      // Platform specific sizes
      let maxMB = 2.0;
      if (platformPreset === 'discord') maxMB = 8.0;
      else if (platformPreset === 'email') maxMB = 1.0;
      else if (platformPreset === 'youtube') maxMB = 2.0;

      const options = {
        maxSizeMB: maxMB,
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        initialQuality: quality,
        onProgress: (p: number) => setProgress(p)
      };

      const compressedFile = await imageCompression(file, options);
      setProgress(100);

      const downloadUrl = URL.createObjectURL(compressedFile);
      const savedPercentage = Math.round((1 - compressedFile.size / file.size) * 100);

      setResult({
        originalSize: file.size,
        newSize: compressedFile.size,
        savedPercentage: savedPercentage > 0 ? savedPercentage : 0,
        downloadUrl,
        downloadFilename: `creator_optimized_${file.name}`,
        message: `Image optimized successfully to ${(compressedFile.size / 1024).toFixed(1)} KB for platforms matching ${platformPreset.toUpperCase()} constraints.`
      });

    } catch (err: any) {
      console.error(err);
      setError('An error occurred during compression. Please adjust dimensions and try again.');
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
            <div className="flex items-center justify-between bg-muted-bg/30 p-4 rounded-xl text-sm">
              <div>
                <span className="font-semibold block mb-0.5">Original File</span>
                <span className="text-muted-fg">{file.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold block mb-0.5">Original Size</span>
                <span className="text-muted-fg">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Creator Platforms */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Target Creator Platform</label>
                <select
                  value={platformPreset}
                  onChange={(e) => setPlatformPreset(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-medium outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="youtube">YouTube Thumbnail limit (Under 2MB)</option>
                  <option value="discord">Discord Share limit (Under 8MB)</option>
                  <option value="email">Standard Email limit (Under 1MB)</option>
                </select>
              </div>

              {/* Compression Ratio */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-muted-fg uppercase tracking-wider">Max Dimensions (Scaling Width/Height)</label>
                  <span className="font-semibold text-primary-600">{maxWidth}px</span>
                </div>
                <select
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-medium outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="1920">1080p FHD (Keep max 1920px)</option>
                  <option value="1280">720p HD (Keep max 1280px)</option>
                  <option value="800">Compact Size (Keep max 800px)</option>
                  <option value="4000">Original / 4K UHD max size</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <label className="font-semibold text-muted-fg uppercase tracking-wider">Compression Ratio (Quality factor)</label>
                <span className="font-semibold text-primary-600">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.95"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-primary-600 mt-2"
              />
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
