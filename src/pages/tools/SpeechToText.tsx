import { Helmet } from 'react-helmet-async';
import React, { useState, useRef, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { Download, Copy, Settings2, FileText, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
// @ts-ignore
import WhisperWorker from '../../workers/whisper.worker?worker';

const LANGUAGES = [
  'Auto Detect', 'English', 'Urdu', 'Hindi', 'Arabic', 'Spanish', 
  'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Chinese'
];

export const SpeechToText = () => {
  const tool = getToolById('speech-to-text');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string>();
  
  const [language, setLanguage] = useState('Auto Detect');
  const [mode, setMode] = useState<'verbatim' | 'clean'>('verbatim');
  const [showTimestamps, setShowTimestamps] = useState(true);
  
  const [srtTranscript, setSrtTranscript] = useState<string | null>(null);
  const [editableTranscript, setEditableTranscript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  const cleanFillerWords = (text: string): string => {
    const fillerRegex = /\b(uh|um|er|ah|hmm|uh-huh)\b/gi;
    let cleaned = text.replace(fillerRegex, '');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');
    return cleaned.trim();
  };

  const formatTime = (seconds: number, isVtt = false): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    const pad = (n: number, width = 2) => String(n).padStart(width, '0');
    const sep = isVtt ? '.' : ',';
    return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms, 3)}`;
  };

  const generateSrtFromChunks = (chunks: any[], selectedMode: 'verbatim' | 'clean'): string => {
    if (!chunks || chunks.length === 0) return '';
    let srt = '';
    chunks.forEach((chunk, index) => {
      let text = chunk.text || '';
      if (selectedMode === 'clean') {
        text = cleanFillerWords(text);
      }
      
      const start = chunk.timestamp?.[0] !== undefined ? chunk.timestamp[0] : index * 3;
      const end = chunk.timestamp?.[1] !== undefined ? chunk.timestamp[1] : (index + 1) * 3;
      
      srt += `${index + 1}\n`;
      srt += `${formatTime(start)} --> ${formatTime(end)}\n`;
      srt += `${text.trim()}\n\n`;
    });
    return srt.trim();
  };

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('video/') && !files[0].type.startsWith('audio/')) {
        setError('Please select a valid video or audio file.');
        return;
      }
      setFile(files[0]);
      setError(undefined);
      setSrtTranscript(null);
      setEditableTranscript('');
    }
  };

  const handleReset = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setFile(null);
    setSrtTranscript(null);
    setEditableTranscript('');
    setError(undefined);
    setProgress(0);
    setStatusText('');
    setProcessing(false);
  };

  // Convert SRT to readable text if timestamps are off
  useEffect(() => {
    if (!srtTranscript) {
      setEditableTranscript('');
      return;
    }
    
    if (showTimestamps) {
      setEditableTranscript(srtTranscript);
    } else {
      const lines = srtTranscript.split('\n');
      const textOnly = lines.filter(line => {
        const isNumber = /^\d+$/.test(line.trim());
        const isTimestamp = line.includes('-->');
        return !isNumber && !isTimestamp && line.trim() !== '';
      }).join('\n\n');
      setEditableTranscript(textOnly);
    }
  }, [srtTranscript, showTimestamps]);

  // Clean worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const prepareAudioData = async (audioFile: File): Promise<Float32Array> => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Decode audio track from the media file
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const targetSampleRate = 16000;
    const offlineCtx = new OfflineAudioContext(
      1, // mono
      Math.round(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0);
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(undefined);
    setProgress(5);
    setStatusText('Preparing audio locally...');

    try {
      // Step 1: Decode and resample audio to 16kHz Float32 mono
      const audioData = await prepareAudioData(file);

      // Step 2: Initialize Whisper Worker
      setProgress(15);
      setStatusText('Loading Whisper Speech AI...');

      workerRef.current = new WhisperWorker();

      workerRef.current.onmessage = (event) => {
        const { type, status, progress: workerProgress, output, error: workerError } = event.data;

        if (type === 'status') {
          setStatusText(status);
          setProgress(workerProgress);
        } else if (type === 'result') {
          setProgress(100);
          setStatusText('Transcription complete!');
          
          const chunks = output?.chunks || [];
          if (chunks.length === 0 && output?.text) {
            // Whisper returned text but no segmented chunks
            chunks.push({ text: output.text, timestamp: [0, file.size / 50000] }); // estimation
          }

          if (chunks.length === 0) {
            setError('No speech detected or speech model was unable to parse audio.');
          } else {
            const srt = generateSrtFromChunks(chunks, mode);
            setSrtTranscript(srt);
          }
          setProcessing(false);
          workerRef.current?.terminate();
          workerRef.current = null;
        } else if (type === 'error') {
          setError(workerError || 'Model execution error.');
          setProcessing(false);
          workerRef.current?.terminate();
          workerRef.current = null;
        }
      };

      // Send audio data to worker
      workerRef.current.postMessage({
        audioData,
        language: language === 'Auto Detect' ? null : language.toLowerCase(),
        mode
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while preparing audio file. Please ensure it is a valid audio/video format.');
      setProcessing(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(editableTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const originalName = file?.name.replace(/\.[^/.]+$/, "") || "transcript";
    downloadFile(editableTranscript, `${originalName}.txt`, "text/plain");
  };
  
  const handleDownloadSrt = () => {
    if (!srtTranscript) return;
    const originalName = file?.name.replace(/\.[^/.]+$/, "") || "transcript";
    downloadFile(srtTranscript, `${originalName}.srt`, "text/plain");
  };
  
  const handleDownloadVtt = () => {
    if (!srtTranscript) return;
    let vtt = "WEBVTT\n\n" + srtTranscript.replace(/,/g, '.');
    const originalName = file?.name.replace(/\.[^/.]+$/, "") || "transcript";
    downloadFile(vtt, `${originalName}.vtt`, "text/vtt");
  };

  if (!tool) return null;

  return (
    <>
      <Helmet>
        <title>Speech to Text — Local Offline Transcription</title>
        <meta name="description" content="Convert speech from video and audio files into accurate, editable text with timestamps entirely inside your browser." />
        <link rel="canonical" href={window.location.origin + "/tool/speech-to-text"} />
      </Helmet>
      <ToolWrapper tool={tool}>
        <ToolLayout
          toolId={tool.id}
          title={tool.name}
          description="Turn your video or audio into accurate, editable text."
          accept="video/*,audio/*"
          onFileSelect={handleFileSelect}
          processing={processing}
          progress={progress}
          error={error}
          onReset={handleReset}
          onProcess={file && !srtTranscript ? handleProcess : undefined}
        >
          {file && !srtTranscript && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-muted-bg rounded-xl border border-border-color">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-fg">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-foreground flex items-center">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Transcription Options
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Language</label>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent-color"
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Mode</label>
                    <select 
                      value={mode} 
                      onChange={(e) => setMode(e.target.value as 'verbatim' | 'clean')}
                      className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent-color"
                    >
                      <option value="verbatim">Verbatim (Exact words)</option>
                      <option value="clean">Clean (Local filler word cleanup)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {processing && statusText && (
                <div className="flex flex-col items-center justify-center py-4 space-y-2 text-center text-sm text-accent-color">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="animate-pulse font-medium">{statusText}</p>
                </div>
              )}
              
              {/* Privacy Warning Note */}
              <div className="flex items-start gap-3 p-4 bg-accent-color/5 rounded-xl border border-accent-color/10">
                <Shield className="w-5 h-5 text-accent-color flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-fg leading-relaxed">
                  <span className="font-bold text-foreground block mb-0.5">Privacy Protected</span>
                  Your file is processed locally in your browser whenever supported. Your file is not sent to an AI API.
                </div>
              </div>
            </div>
          )}
          
          {srtTranscript && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-accent-color" />
                  <h3 className="text-lg font-bold text-foreground">Transcript</h3>
                </div>
                
                <label className="flex items-center space-x-2 text-sm text-foreground cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                    className="rounded border-border-color text-accent-color focus:ring-accent-color"
                  />
                  <span>Show timestamps</span>
                </label>
              </div>
              
              <textarea
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                className="w-full h-64 md:h-96 p-4 bg-muted-bg border border-border-color rounded-xl text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-color resize-y"
                spellCheck="false"
              />
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center px-4 py-2 bg-muted-bg hover:bg-border-color rounded-lg text-sm font-medium text-foreground transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
                
                <button
                  onClick={handleDownloadTxt}
                  className="flex items-center px-4 py-2 bg-muted-bg hover:bg-border-color rounded-lg text-sm font-medium text-foreground transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download TXT
                </button>
                
                <button
                  onClick={handleDownloadSrt}
                  className="flex items-center px-4 py-2 bg-muted-bg hover:bg-border-color rounded-lg text-sm font-medium text-foreground transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download SRT
                </button>
                
                <button
                  onClick={handleDownloadVtt}
                  className="flex items-center px-4 py-2 bg-muted-bg hover:bg-border-color rounded-lg text-sm font-medium text-foreground transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download VTT
                </button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-border-color">
                <h4 className="text-sm font-semibold text-muted-fg mb-4 uppercase tracking-wider text-center">You might also need</h4>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/tool/video-to-mp3" className="px-4 py-2 bg-muted-bg/50 hover:bg-muted-bg rounded-full text-sm font-medium text-foreground transition-colors">
                    Video → MP3
                  </Link>
                  <Link to="/tool/audio-converter" className="px-4 py-2 bg-muted-bg/50 hover:bg-muted-bg rounded-full text-sm font-medium text-foreground transition-colors">
                    Audio Converter
                  </Link>
                  <Link to="/tool/audio-compressor" className="px-4 py-2 bg-muted-bg/50 hover:bg-muted-bg rounded-full text-sm font-medium text-foreground transition-colors">
                    Audio Compressor
                  </Link>
                  <Link to="/tool/audio-trimmer" className="px-4 py-2 bg-muted-bg/50 hover:bg-muted-bg rounded-full text-sm font-medium text-foreground transition-colors">
                    Audio Trimmer
                  </Link>
                </div>
              </div>
            </div>
          )}
        </ToolLayout>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">How does this offline transcriber work?</h3>
              <p className="text-muted-fg">It uses Whisper, a state-of-the-art speech recognition model compiled to run directly in your browser. All speech decoding and processing occurs on your graphics card (via WebGPU) or processor (via WASM) without uploading your files.</p>
            </div>
            <div>
              <h3 className="font-bold">What files are supported?</h3>
              <p className="text-muted-fg">You can upload video files (MP4, MOV, WebM, MKV) and audio files (MP3, WAV, M4A, AAC).</p>
            </div>
            <div>
              <h3 className="font-bold">Is my transcription private?</h3>
              <p className="text-muted-fg">Absolutely. Because 100% of the extraction and transcription takes place locally inside your browser, no file data ever leaves your device.</p>
            </div>
          </div>
        </div>
      </ToolWrapper>
    </>
  );
};
