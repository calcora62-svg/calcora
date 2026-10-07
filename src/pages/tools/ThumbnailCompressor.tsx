import React, { useState } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';

export const ThumbnailCompressor = () => {
  const tool = getToolById('thumbnail-compressor');

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

  // Parameters
  const [quality, setQuality] = useState(0.8);
  const [targetMaxMB, setTargetMaxMB] = useState(2); // standard YouTube limit is 2MB

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

      // Adjust quality based on target max size or quality slider
      const targetMB = Math.min(targetMaxMB, 10);
      const options = {
        maxSizeMB: targetMB,
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
        downloadFilename: `compressed_thumbnail_${file.name}`,
        message: `Your thumbnail has been optimized to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB, well within platform limits.`
      });

    } catch (err: any) {
      console.error(err);
      setError('An error occurred during compression. Please adjust settings and try again.');
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
                <span className="font-semibold block mb-0.5">File Size</span>
                <span className="text-muted-fg">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Quality level */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-muted-fg uppercase tracking-wider">Compression Strength</label>
                  <span className="font-semibold text-primary-600">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-primary-600 mt-2"
                />
              </div>

              {/* Target limit */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Target File Size Limit</label>
                <select
                  value={targetMaxMB}
                  onChange={(e) => setTargetMaxMB(parseFloat(e.target.value))}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-medium outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="2.0">Under 2.0 MB (YouTube Thumbnail standard)</option>
                  <option value="1.5">Under 1.5 MB</option>
                  <option value="1.0">Under 1.0 MB (Highly optimized)</option>
                  <option value="0.5">Under 500 KB</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
