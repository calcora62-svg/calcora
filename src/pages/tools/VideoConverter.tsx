import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';

export const VideoConverter = () => {
  const tool = getToolById('video-converter');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();
  const [targetFormat, setTargetFormat] = useState<'mp4' | 'webm' | 'avi'>('mp4');
  
  const ffmpegRef = useRef(new FFmpeg());

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('video/')) {
        setError('Please select a valid video file.');
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
    setProgress(1);
    
    try {
      const ffmpeg = ffmpegRef.current;
      
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
          wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm"
        });
      }

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(Math.max(1, p * 100)));
      });

      const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputName = `output.${targetFormat}`;
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec(['-i', inputName, outputName]);

      const fileData = await ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData as ArrayBuffer);
      const blob = new Blob([data.buffer], { type: `video/${targetFormat}` });
      if (blob.size === 0) throw new Error("Processing resulted in an empty file.");
      
      setResult({
        downloadUrl: URL.createObjectURL(blob),
        downloadFilename: `converted_${file.name.replace(/\.[^/.]+$/, "")}.${targetFormat}`,
        message: `Successfully converted to ${targetFormat.toUpperCase()}`
      });
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
    } catch (err: any) {
      console.error(err);
      setError('Conversion failed. The browser may have run out of memory or unsupported codec.');
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
        accept="video/*"
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
            <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground mb-4">
              <span className="font-semibold block">{file.name}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-4">Convert to:</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'mp4', label: 'MP4' },
                  { value: 'webm', label: 'WebM' },
                  { value: 'avi', label: 'AVI' }
                ].map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => setTargetFormat(fmt.value as any)}
                    className={`p-4 rounded-xl border font-bold text-lg transition-all ${
                      targetFormat === fmt.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'border-border-color bg-card text-foreground hover:bg-muted-bg/50'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-fg text-center mt-4">
              Processing runs entirely in your browser. This may take a while depending on file size.
            </p>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
