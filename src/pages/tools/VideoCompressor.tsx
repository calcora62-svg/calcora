import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

export const VideoCompressor = () => {
  const tool = getToolById('video-compressor');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; originalSize: number; newSize: number; savedPercentage: number } | undefined>();
  const [error, setError] = useState<string>();
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

    const canUse = usePlanStore.getState().canUseTool('video-compressor');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }
    
    setProcessing(true);
    setError(undefined);
    setProgress(1);
    
    try {
      const ffmpeg = ffmpegRef.current;
      
      // FIX: Use toBlobURL to bypass CORS issues in iframe environments
      if (!ffmpeg.loaded) {
        try {
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
        } catch (loadErr) {
          console.error('[FFmpeg Load Failed]', loadErr);
          throw new Error('Video engine failed to load. Please refresh and try again.');
        }
      }

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(Math.max(1, p * 100)));
      });

      const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputName = 'output.mp4';
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec(['-i', inputName, '-vcodec', 'libx264', '-crf', '28', outputName]);

      const fileData = await ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData as ArrayBuffer);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      if (blob.size === 0) throw new Error("Processing resulted in an empty file.");
      
      const savedPercentage = Math.round((1 - blob.size / file.size) * 100);

      setResult({
        originalSize: file.size,
        newSize: blob.size,
        savedPercentage: savedPercentage > 0 ? savedPercentage : 0,
        downloadUrl: URL.createObjectURL(blob),
        downloadFilename: `compressed_${file.name.replace(/\.[^/.]+$/, "")}.mp4`
      });

      usePlanStore.getState().consumeUsage('video-compressor');
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Video processing failed. This may happen if the browser runs out of memory for large files or blocks WebAssembly.');
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
          <div className="space-y-4">
            <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground">
              <span className="font-semibold block">{file.name}</span>
            </div>
            <p className="text-xs text-muted-fg text-center mt-4">
              Compression runs entirely in your browser using WebAssembly. This may take several minutes depending on the file size and your device's speed.
            </p>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};