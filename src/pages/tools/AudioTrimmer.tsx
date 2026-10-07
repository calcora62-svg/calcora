import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';

export const AudioTrimmer = () => {
  const tool = getToolById('audio-trimmer');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();
  
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:10');
  const ffmpegRef = useRef(new FFmpeg());

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
    
    if (!startTime || !endTime) {
      setError('Please provide start and end times.');
      return;
    }
    
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

      await ffmpeg.exec(['-i', inputName, '-ss', startTime, '-to', endTime, outputName]);

      const fileData = await ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData as ArrayBuffer);
      const blob = new Blob([data.buffer], { type: 'audio/mp3' });
      if (blob.size === 0) throw new Error("Processing resulted in an empty file.");
      
      setResult({
        downloadUrl: URL.createObjectURL(blob),
        downloadFilename: `trimmed_${file.name.replace(/\.[^/.]+$/, "")}.mp3`,
        message: 'Successfully trimmed audio!'
      });
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
    } catch (err: any) {
      console.error(err);
      setError('Failed to trim audio.');
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Start Time (HH:MM:SS)</label>
                <input 
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground"
                  placeholder="00:00:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">End Time (HH:MM:SS)</label>
                <input 
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground"
                  placeholder="00:00:10"
                />
              </div>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
