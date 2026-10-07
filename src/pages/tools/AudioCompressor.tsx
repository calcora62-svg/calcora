import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';

export const AudioCompressor = () => {
  const tool = getToolById('audio-compressor');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; originalSize: number; newSize: number; savedPercentage: number } | undefined>();
  const [error, setError] = useState<string>();
  const ffmpegRef = useRef(new FFmpeg());
  
  const [bitrate, setBitrate] = useState('64k');

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('audio/')) {
        setError('Please select a valid audio file.');
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
      const outputName = 'output.mp3';
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec(['-i', inputName, '-map', '0:a:0', '-b:a', bitrate, outputName]);

      const fileData = await ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData as ArrayBuffer);
      const blob = new Blob([data.buffer], { type: 'audio/mp3' });
      if (blob.size === 0) throw new Error("Processing resulted in an empty file.");
      
      const savedPercentage = Math.round((1 - blob.size / file.size) * 100);

      setResult({
        originalSize: file.size,
        newSize: blob.size,
        savedPercentage: savedPercentage > 0 ? savedPercentage : 0,
        downloadUrl: URL.createObjectURL(blob),
        downloadFilename: `compressed_${file.name.replace(/\.[^/.]+$/, "")}.mp3`
      });
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
    } catch (err: any) {
      console.error(err);
      setError('Compression failed.');
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
        accept="audio/*"
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
              <label className="block text-sm font-medium text-foreground mb-4">Target Quality / Bitrate:</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '32k', label: 'Very Low (32kbps)' },
                  { value: '64k', label: 'Low (64kbps)' },
                  { value: '128k', label: 'Medium (128kbps)' }
                ].map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => setBitrate(fmt.value)}
                    className={`p-4 rounded-xl border font-bold text-sm transition-all ${
                      bitrate === fmt.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'border-border-color bg-card text-foreground hover:bg-muted-bg/50'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
