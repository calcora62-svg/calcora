import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { 
  Video, Trash2, Sliders, Play, Pause, RefreshCw, AlertCircle, 
  FileVideo, CheckCircle, Type, HelpCircle, Scissors, Volume2, VolumeX,
  Sparkles, Download, Captions, ArrowRight, ArrowLeft, Shield, CreditCard,
  RotateCcw, Eye, Plus, Palette, Info, Zap, Gauge, Clock, AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { usePlanStore } from '../../store/usePlanStore';
import { log, warn, error as logError } from '../../utils/logger';

interface CaptionItem {
  id: string;
  start: number; // in seconds
  end: number;
  text: string;
}

const FONT_FAMILIES = [
  { id: 'Impact, sans-serif', label: 'Impact (Viral / Memes)' },
  { id: 'Arial, sans-serif', label: 'Arial (Clean Sans)' },
  { id: "'Montserrat', sans-serif", label: 'Montserrat (Modern)' },
  { id: "'Roboto', sans-serif", label: 'Roboto (Digital)' },
  { id: "'Georgia', serif", label: 'Georgia (Editorial)' },
  { id: "'Courier New', monospace", label: 'Courier New (Typewriter)' },
  { id: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { id: "'Comic Sans MS', cursive", label: 'Comic Sans (Playful)' }
];

const QUICK_COLORS = ['#FFFFFF', '#FACC15', '#22D3EE', '#4ADE80', '#FB923C', '#F87171', '#000000'];

function hexToRgba(hex: string, opacity: number): string {
  if (opacity <= 0) return 'transparent';
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const SocialVideoMaker = () => {
  const tool = getToolById('social-video-maker');
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Multi-step workflow: 'upload' | 'edit' | 'rendering' | 'export'
  const [step, setStep] = useState<'upload' | 'edit' | 'rendering' | 'export'>('upload');

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<any | undefined>();

  // Video Settings
  const [aspectRatio, setAspectRatio] = useState<'9_16' | '1_1' | '16_9'>('9_16');
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [videoDuration, setVideoDuration] = useState(15);
  
  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Captions
  const [captions, setCaptions] = useState<CaptionItem[]>([
    { id: '1', start: 2, end: 5, text: "Welcome to my short video!" },
    { id: '2', start: 6, end: 9, text: "Check out this incredible feature." }
  ]);
  const [newCapText, setNewCapText] = useState('');
  const [newCapStart, setNewCapStart] = useState(2);
  const [newCapEnd, setNewCapEnd] = useState(5);

  // Subtitle styling options
  const [captionFontFamily, setCaptionFontFamily] = useState('Impact, sans-serif');
  const [captionFontSize, setCaptionFontSize] = useState(24); // 12 to 72 px
  const [captionColor, setCaptionColor] = useState('#FFFFFF');
  const [captionBgColor, setCaptionBgColor] = useState('#000000');
  const [captionBgOpacity, setCaptionBgOpacity] = useState(0.65); // 0 to 1
  const [captionShadow, setCaptionShadow] = useState(true);
  const [captionPos, setCaptionPos] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [captionPosPercent, setCaptionPosPercent] = useState(82); // vertical %

  // FIX 1 & 2: Export quality controls (High Bitrate 8 Mbps & 60 FPS Smooth default)
  const [exportBitrate, setExportBitrate] = useState<number>(8000000); // 8 Mbps
  const [exportFps, setExportFps] = useState<number>(60); // 60 FPS
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  // Processing Time and Estimation tracking
  const [exportDurationSeconds, setExportDurationSeconds] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('Estimating...');
  const exportStartTimeRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const exportVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Audio persistence refs to prevent duplicate node creation errors
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // FIX 5: Detect best supported MIME type, prioritizing MP4 (H.264) over WebM (VP9)
  const getBestSupportedMimeType = useCallback((): { mimeType: string; isMp4: boolean; extension: string } => {
    if (typeof MediaRecorder === 'undefined') {
      return { mimeType: '', isMp4: false, extension: 'mp4' };
    }

    const preferredList = [
      // MP4 candidates
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264',
      'video/mp4',
      // WebM candidates
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    for (const mime of preferredList) {
      if (MediaRecorder.isTypeSupported(mime)) {
        const isMp4 = mime.startsWith('video/mp4');
        return { mimeType: mime, isMp4, extension: isMp4 ? 'mp4' : 'webm' };
      }
    }

    return { mimeType: '', isMp4: false, extension: 'mp4' };
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [videoUrl]);

  // Audio control synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
      log(`[Audio Control] Volume: ${Math.round(volume * 100)}%, Muted: ${muted}`);
    }
  }, [volume, muted]);

  // Handle position preset change
  const handlePositionPreset = (pos: 'top' | 'center' | 'bottom') => {
    setCaptionPos(pos);
    if (pos === 'top') setCaptionPosPercent(14);
    else if (pos === 'center') setCaptionPosPercent(50);
    else setCaptionPosPercent(82);
    log(`[Subtitle] Position preset: ${pos}`);
  };

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
    setError(undefined);
    setResult(undefined);
    setStep('edit'); // Transition directly to Workspace Editor
    
    // Auto populate duration and source resolution when metadata loads
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 15;
      const sW = tempVideo.videoWidth || 1920;
      const sH = tempVideo.videoHeight || 1080;
      setVideoDuration(dur);
      setSourceDimensions({ width: sW, height: sH });
      setTrimStart(0);
      setTrimEnd(Math.min(dur, 15)); // default 15s trim window
      setNewCapStart(Math.min(2, Math.round(dur * 0.1)));
      setNewCapEnd(Math.min(5, Math.round(dur * 0.4)));
      log(`[Video Loaded] File: ${selectedFile.name}, Duration: ${dur.toFixed(2)}s, Dimensions: ${sW}x${sH}`);
    };
  };

  const handleReset = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setResult(undefined);
    setError(undefined);
    setProgress(0);
    setProcessing(false);
    setIsPlaying(false);
    setStep('upload');
  };

  // Add caption
  const addCaption = () => {
    if (!newCapText.trim()) return;
    const start = Math.max(0, parseFloat(String(newCapStart)) || 0);
    const end = Math.max(start + 0.5, parseFloat(String(newCapEnd)) || (start + 2));
    const item: CaptionItem = {
      id: Math.random().toString(36).substring(2, 11),
      start,
      end,
      text: newCapText.trim()
    };
    setCaptions(prev => [...prev, item].sort((a,b) => a.start - b.start));
    setNewCapText('');
    // Advance next caption start to previous end
    setNewCapStart(end);
    setNewCapEnd(Math.min(videoDuration, end + 3));
    log(`[Subtitle Added] "${item.text}" from ${item.start}s to ${item.end}s`);
  };

  const removeCaption = (id: string) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const jumpToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      log(`[Video Seek] Jumped to ${seconds.toFixed(2)}s`);
    }
  };

  // Synchronize playback timeline and enforce trim bounds
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    // Enforce Trim Play Range Loop
    if (t >= trimEnd) {
      log(`[Trim] Reached trimEnd (${trimEnd}s). Looping back to trimStart (${trimStart}s)`);
      videoRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    } else if (t < trimStart) {
      videoRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      // If outside trim range, seek to trimStart before playing
      if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
        setCurrentTime(trimStart);
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTrimStartChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, trimEnd - 0.5));
    setTrimStart(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
    log(`[Trim] Trim start set to ${clamped}s (video seeked)`);
  };

  const handleTrimEndChange = (val: number) => {
    const clamped = Math.min(videoDuration, Math.max(val, trimStart + 0.5));
    setTrimEnd(clamped);
    if (videoRef.current && videoRef.current.currentTime > clamped) {
      videoRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    }
    log(`[Trim] Trim end set to ${clamped}s`);
  };

  // Find active caption strictly respecting start & end time
  const activeCaption = captions.find(c => {
    const s = Number(c.start);
    const e = Number(c.end);
    return currentTime >= s && currentTime <= e;
  });

  // Export engine with high bitrate, requestVideoFrameCallback, and source-matched resolution
  const handleExport = async () => {
    const video = videoRef.current;
    if (!video || !file) return;

    const canUse = usePlanStore.getState().canUseTool('social-video-maker');
    if (!canUse) {
      setShowUpgradeModal(true);
      return;
    }

    const activePlan = usePlanStore.getState().activePlan;
    const duration = trimEnd - trimStart;
        const maxDuration = activePlan === 'premium' ? 300 : 30;
    if (duration > maxDuration) {
      setError(`Video export limit is ${maxDuration} seconds for your ${activePlan} plan. You selected ${duration.toFixed(1)} seconds. Please trim the video or upgrade.`);
      if (activePlan !== 'premium') {
        setShowUpgradeModal(true);
      }
      return;
    }

    setStep('rendering');
    setProcessing(true);
    setProgress(5);
    setEstimatedTimeRemaining('Calculating...');
    exportStartTimeRef.current = Date.now();
    video.pause();
    setIsPlaying(false);

    try {
      // FIX 4: Avoid unnecessary resizing & upscaling blur. Match source resolution and ensure even bounds.
      const sourceW = video.videoWidth || sourceDimensions.width || 1920;
      const sourceH = video.videoHeight || sourceDimensions.height || 1080;

      let width = 1080;
      let height = 1920;

      if (aspectRatio === '9_16') {
        // 9:16 vertical - match source vertical quality, at least 1080x1920
        const targetH = Math.max(sourceH, 1920);
        height = Math.round(targetH / 2) * 2;
        width = Math.round((height * (9 / 16)) / 2) * 2;
      } else if (aspectRatio === '1_1') {
        // 1:1 square - match min dimension or at least 1080x1080
        const dim = Math.max(Math.min(sourceW, sourceH), 1080);
        width = Math.round(dim / 2) * 2;
        height = width;
      } else {
        // 16:9 widescreen - match source width or at least 1920x1080
        const targetW = Math.max(sourceW, 1920);
        width = Math.round(targetW / 2) * 2;
        height = Math.round((width * (9 / 16)) / 2) * 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Could not acquire 2D drawing context.");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // FIX 2: Capture canvas stream matching target frame rate (default 60fps for silky smooth motion)
      const targetFps = exportFps || 60;
      const videoStream = canvas.captureStream(targetFps);

      // Safe Web Audio Graph Connection
      let audioTrack: MediaStreamTrack | null = null;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        if (!audioSourceRef.current) {
          audioSourceRef.current = audioCtx.createMediaElementSource(video);
        }
        const source = audioSourceRef.current;
        const dest = audioCtx.createMediaStreamDestination();
        audioDestRef.current = dest;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = muted ? 0 : volume;

        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnect error if not connected yet
        }

        source.connect(gainNode);
        gainNode.connect(dest);
        gainNode.connect(audioCtx.destination);

        audioTrack = dest.stream.getAudioTracks()[0] || null;
        if (audioTrack) {
          videoStream.addTrack(audioTrack);
        }
      } catch (audioErr) {
        warn("[Audio Setup Warning]", audioErr);
      }

      // FIX 5: Prefer MP4 (H.264/AVC) if supported by browser, else high-quality WebM VP9
      const { mimeType: chosenMime, isMp4, extension } = getBestSupportedMimeType();

      // FIX 1: Set high bitrate (8 Mbps default = 8000000 bps) and 128 kbps audio
      const recorderOptions: MediaRecorderOptions = {
        ...(chosenMime ? { mimeType: chosenMime } : {}),
        videoBitsPerSecond: exportBitrate, // 8,000,000 bps
        audioBitsPerSecond: 128000 // 128 kbps
      };

      log(`[MediaRecorder Init] Mime: ${chosenMime || 'browser-default'}, Video Bitrate: ${exportBitrate} bps, Target FPS: ${targetFps}, Canvas: ${width}x${height}`);

      const mediaRecorder = new MediaRecorder(videoStream, recorderOptions);
      recorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const outputMime = chosenMime || (isMp4 ? 'video/mp4' : 'video/webm');
        const recordedBlob = new Blob(chunks, { type: outputMime });
        const finalUrl = URL.createObjectURL(recordedBlob);

        const totalElapsedSec = Math.max(1, Math.round((Date.now() - (exportStartTimeRef.current || Date.now())) / 1000));
        setExportDurationSeconds(totalElapsedSec);

        log(`[Export Succeeded] Blob size: ${recordedBlob.size} bytes (${(recordedBlob.size / 1024 / 1024).toFixed(2)} MB), Type: ${outputMime}, Took: ${totalElapsedSec}s`);

        const cleanBase = file.name.split('.').slice(0, -1).join('.') || 'social_video';
        setResult({
          downloadUrl: finalUrl,
          downloadFilename: `${cleanBase}_${aspectRatio}_${targetFps}fps.${extension}`,
          originalSize: file.size,
          newSize: recordedBlob.size,
          format: isMp4 ? 'MP4 (H.264 / AVC)' : 'WebM (VP9)',
          bitrate: `${(exportBitrate / 1000000).toFixed(0)} Mbps`,
          fps: `${targetFps} FPS`,
          resolution: `${width} × ${height}`,
          durationSeconds: totalElapsedSec
        });

        usePlanStore.getState().consumeUsage('social-video-maker');
        setProcessing(false);
        setProgress(100);
        setStep('export');
      };

      // FIX 3: Hardware-synchronized rendering using requestVideoFrameCallback
      const hasRvfc = typeof (video as any).requestVideoFrameCallback === 'function';
      log(`[Frame Engine] requestVideoFrameCallback active: ${hasRvfc}`);

      let stopped = false;
      let rvfcHandle: number | null = null;
      let rafHandle: number | null = null;

      const durationToRecord = Math.max(0.1, trimEnd - trimStart);

      const drawFrameToCanvas = (currentT: number) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        const vWidth = video.videoWidth || sourceW;
        const vHeight = video.videoHeight || sourceH;
        const vRatio = vWidth / vHeight;
        const cRatio = width / height;

        let drawW = width;
        let drawH = height;
        let x = 0;
        let y = 0;

        if (fitMode === 'cover') {
          if (vRatio > cRatio) {
            drawW = height * vRatio;
            x = (width - drawW) / 2;
          } else {
            drawH = width / vRatio;
            y = (height - drawH) / 2;
          }
        } else { // contain
          if (vRatio > cRatio) {
            drawH = width / vRatio;
            y = (height - drawH) / 2;
          } else {
            drawW = height * vRatio;
            x = (width - drawW) / 2;
          }
        }

        ctx.drawImage(video, x, y, drawW, drawH);

        // Render synchronized subtitle if within active window
        const activeCap = captions.find(c => currentT >= Number(c.start) && currentT <= Number(c.end));

        if (activeCap) {
          ctx.save();
          // Scale font proportional to render width (reference ~ 360px on mobile viewport)
          const baseScale = width / 360;
          const scaledFontSize = Math.round(captionFontSize * baseScale * 0.72);
          ctx.font = `bold ${scaledFontSize}px ${captionFontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textMetric = ctx.measureText(activeCap.text);
          const textWidth = textMetric.width;
          const bgPaddingH = scaledFontSize * 0.8;
          const bgPaddingV = scaledFontSize * 0.5;
          const posY = height * (captionPosPercent / 100);

          if (captionBgOpacity > 0) {
            ctx.fillStyle = hexToRgba(captionBgColor, captionBgOpacity);
            const rx = (width - textWidth) / 2 - bgPaddingH / 2;
            const ry = posY - scaledFontSize / 2 - bgPaddingV / 2;
            const rw = textWidth + bgPaddingH;
            const rh = scaledFontSize + bgPaddingV;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(rx, ry, rw, rh, 12);
            } else {
              ctx.rect(rx, ry, rw, rh);
            }
            ctx.fill();
          }

          if (captionShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(3, Math.round(scaledFontSize * 0.09));
            ctx.strokeText(activeCap.text, width / 2, posY);
          }

          ctx.fillStyle = captionColor;
          ctx.fillText(activeCap.text, width / 2, posY);
          ctx.restore();
        }
      };

      const renderCallback = (now?: DOMHighResTimeStamp, metadata?: any) => {
        if (stopped) return;

        const currentT = video.currentTime;

        // Check if trim range elapsed or video finished
        if (video.paused || video.ended || currentT >= trimEnd) {
          stopped = true;
          if (rvfcHandle && (video as any).cancelVideoFrameCallback) {
            (video as any).cancelVideoFrameCallback(rvfcHandle);
          }
          if (rafHandle) {
            cancelAnimationFrame(rafHandle);
          }
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          video.pause();
          return;
        }

        // Draw decoded frame
        drawFrameToCanvas(currentT);

        // Update progress percentage and calculate dynamic time estimate
        const currentProgress = Math.min(95, 5 + Math.round(((currentT - trimStart) / durationToRecord) * 90));
        setProgress(currentProgress);

        if (exportStartTimeRef.current > 0 && currentProgress > 10) {
          const elapsed = (Date.now() - exportStartTimeRef.current) / 1000;
          const estimatedTotal = elapsed / (currentProgress / 100);
          const remainingSec = Math.max(1, Math.round(estimatedTotal - elapsed));
          if (remainingSec >= 60) {
            const mins = Math.floor(remainingSec / 60);
            const secs = remainingSec % 60;
            setEstimatedTimeRemaining(`~${mins}m ${secs}s remaining`);
          } else {
            setEstimatedTimeRemaining(`~${remainingSec}s remaining`);
          }
        } else {
          setEstimatedTimeRemaining('Calculating...');
        }

        // Schedule next decoded frame
        if (hasRvfc) {
          rvfcHandle = (video as any).requestVideoFrameCallback(renderCallback);
        } else {
          rafHandle = requestAnimationFrame(renderCallback);
        }
      };

      // Seek to trim start and begin recording on seeked
      video.currentTime = trimStart;
      video.muted = muted;
      video.volume = volume;

      let recordingInitiated = false;

      video.onseeked = async () => {
        if (recordingInitiated) return;
        recordingInitiated = true;

        try {
          mediaRecorder.start(100); // 100ms time slices
          await video.play();

          if (hasRvfc) {
            rvfcHandle = (video as any).requestVideoFrameCallback(renderCallback);
          } else {
            rafHandle = requestAnimationFrame(renderCallback);
          }
        } catch (playErr) {
          logError("[Playback Error in Export]", playErr);
          rafHandle = requestAnimationFrame(renderCallback);
        }
      };

    } catch (err: any) {
      logError("[Export Engine Failure]", err);
      setError(err?.message || 'Failed to capture or encode video frames.');
      setProcessing(false);
      setStep('edit');
    }
  };

  // Preview container dimensions based on Aspect Ratio
  const getPreviewContainerStyle = () => {
    if (aspectRatio === '9_16') {
      return {
        width: '260px',
        height: '462px', // exact 9:16
        maxWidth: '100%'
      };
    } else if (aspectRatio === '1_1') {
      return {
        width: '360px',
        height: '360px', // exact 1:1
        maxWidth: '100%'
      };
    } else { // 16_9
      return {
        width: '100%',
        maxWidth: '520px',
        height: '292px' // exact 16:9
      };
    }
  };

  return (
    <ToolWrapper tool={tool}>
      <ToolLayout
        toolId={tool?.id}
        title={tool?.name || 'Social Video Maker'}
        description={tool?.description || ''}
        accept="video/mp4, video/webm, video/ogg"
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={progress}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={undefined}
      >
        {/* Step Progress Bar */}
        {file && (
          <div className="w-full max-w-2xl mx-auto mb-6 bg-card border border-border-color p-4 rounded-2xl flex items-center justify-between shadow-sm">
            {[
              { id: 'edit', label: '1. Live Edit & Preview' },
              { id: 'rendering', label: '2. Render Stream' },
              { id: 'export', label: '3. Complete Export' }
            ].map((s) => {
              const active = step === s.id;
              const completed = (s.id === 'edit' && step !== 'edit') || (s.id === 'rendering' && step === 'export');
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    active ? 'bg-primary text-primary-foreground scale-110 shadow-sm' : completed ? 'bg-green-500 text-white' : 'bg-muted-bg text-muted-fg'
                  }`}>
                    {completed ? '✓' : s.id === 'edit' ? '1' : s.id === 'rendering' ? '2' : '3'}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-foreground font-black' : 'text-muted-fg'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: Configure, Subtitles & Real-time CSS Overlay player */}
        {step === 'edit' && file && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-muted-bg/30 p-3.5 rounded-xl border border-border-color flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileVideo className="w-7 h-7 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm truncate max-w-sm">{file.name}</h4>
                  <p className="text-xs text-muted-fg">Total length: {videoDuration.toFixed(1)}s • Trimmed: {(trimEnd - trimStart).toFixed(1)}s</p>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer">
                Change Video
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Video settings and trimming controls */}
              <div className="lg:col-span-4 space-y-5">
                <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider border-b border-border-color pb-2 flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5" />
                  1. Format, Fit & Trim
                </h3>

                {/* Aspect ratio */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-fg font-bold flex items-center justify-between">
                    <span>Platform Format</span>
                    <span className="text-[10px] text-primary font-mono font-bold">
                      {aspectRatio === '9_16' ? '9:16 (Vertical)' : aspectRatio === '1_1' ? '1:1 (Square)' : '16:9 (Landscape)'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '9_16', label: '9:16', sub: 'TikTok/Reels' },
                      { id: '1_1', label: '1:1', sub: 'Instagram' },
                      { id: '16_9', label: '16:9', sub: 'YouTube' }
                    ].map(aspect => (
                      <button
                        key={aspect.id}
                        onClick={() => {
                          setAspectRatio(aspect.id as any);
                          log(`[Platform Format Clicked] Switched to ${aspect.id}`);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          aspectRatio === aspect.id
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : 'bg-card border-border-color text-muted-fg hover:bg-muted-bg/50'
                        }`}
                      >
                        <span className="font-extrabold text-xs block">{aspect.label}</span>
                        <span className="text-[9px] opacity-80 block">{aspect.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fitting option */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-fg font-bold flex items-center justify-between">
                    <span>Fit Mode</span>
                    <span className="text-[10px] text-primary font-mono font-bold">
                      {fitMode === 'cover' ? 'Crop Fill' : 'Fit Inside'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cover', label: 'Crop Fill (Cover)' },
                      { id: 'contain', label: 'Fit Inside (Black Bars)' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setFitMode(mode.id as any);
                          log(`[Fit Mode Clicked] Switched to ${mode.id}`);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          fitMode === mode.id 
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                            : 'bg-card border-border-color text-muted-fg hover:bg-muted-bg/50'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Range Trim */}
                <div className="bg-card p-4 rounded-xl border border-border-color space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase">Trim Range</span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {trimStart.toFixed(1)}s — {trimEnd.toFixed(1)}s ({(trimEnd - trimStart).toFixed(1)}s)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-muted-fg font-medium">
                      <span>Start Point</span>
                      <span className="font-mono">{trimStart.toFixed(1)}s</span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={Math.max(0, trimEnd - 0.5)}
                      step={0.1}
                      value={trimStart}
                      onChange={(e) => handleTrimStartChange(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-muted-fg font-medium">
                      <span>End Point</span>
                      <span className="font-mono">{trimEnd.toFixed(1)}s</span>
                    </div>
                    <input 
                      type="range"
                      min={Math.min(videoDuration, trimStart + 0.5)}
                      max={videoDuration}
                      step={0.1}
                      value={trimEnd}
                      onChange={(e) => handleTrimEndChange(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-muted-fg">
                    <button 
                      onClick={() => jumpToTime(trimStart)}
                      className="hover:text-primary font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Jump to Start
                    </button>
                    <span>Loops within range automatically</span>
                  </div>
                </div>

                {/* Volume & Audio Controls */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-fg font-bold flex justify-between">
                    <span>Audio Controls</span>
                    <span className="font-mono text-xs text-primary font-bold">
                      {muted ? 'MUTED' : `${Math.round(volume * 100)}%`}
                    </span>
                  </label>
                  <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border-color">
                    <button 
                      onClick={() => {
                        setMuted(!muted);
                        log(`[Audio Toggle] Mute clicked: ${!muted}`);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        muted 
                          ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                          : 'bg-primary/10 border-primary/30 text-primary'
                      }`}
                      title={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={muted ? 0 : volume} 
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (muted && v > 0) setMuted(false);
                      }}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Column: Video preview & styling layout with interactive overlay */}
              <div className="lg:col-span-4 space-y-4 flex flex-col items-center">
                <div className="w-full flex items-center justify-between border-b border-border-color pb-2">
                  <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider">
                    2. Live Interactive Preview
                  </h3>
                  <span className="text-[10px] font-mono text-muted-fg bg-muted-bg px-2 py-0.5 rounded">
                    {aspectRatio === '9_16' ? '9:16' : aspectRatio === '1_1' ? '1:1' : '16:9'} • {fitMode}
                  </span>
                </div>

                {/* Dynamic Aspect Ratio Preview Container */}
                <div 
                  className="relative border border-border-color rounded-2xl overflow-hidden bg-black flex items-center justify-center transition-all duration-300 shadow-lg mx-auto"
                  style={getPreviewContainerStyle()}
                >
                  <video 
                    ref={videoRef}
                    src={videoUrl || undefined}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onSeeked={handleTimeUpdate}
                    onSeeking={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full transition-all duration-200"
                    style={{
                      objectFit: fitMode
                    }}
                  />

                  {/* Real-time Subtitle CSS overlay simulation */}
                  {activeCaption && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-center pointer-events-none select-none z-20 max-w-[90%] break-words transition-all duration-150 shadow-md"
                      style={{
                        color: captionColor,
                        backgroundColor: hexToRgba(captionBgColor, captionBgOpacity),
                        fontFamily: captionFontFamily,
                        fontSize: `${captionFontSize}px`,
                        fontWeight: 'bold',
                        lineHeight: 1.25,
                        top: `${captionPosPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        textShadow: captionShadow ? '2px 2px 4px rgba(0,0,0,0.9), 0 0 3px #000, 0 0 6px #000' : 'none'
                      }}
                    >
                      {activeCaption.text}
                    </div>
                  )}
                  
                  {/* Platform safe zone helper lines */}
                  {aspectRatio === '9_16' && (
                    <div className="absolute inset-x-3 inset-y-8 border border-dashed border-white/20 pointer-events-none rounded flex items-end justify-center pb-4 z-10">
                      <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">Safe Zone</span>
                    </div>
                  )}

                  {/* Play/Pause overlay badge on hover */}
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all opacity-0 hover:opacity-100 z-15 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center shadow-lg">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </div>
                  </button>
                </div>

                {/* Custom Playback Timeline Bar */}
                <div className="w-full bg-card p-3 rounded-xl border border-border-color space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm cursor-pointer hover:bg-primary-600 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <button 
                        onClick={() => jumpToTime(trimStart)}
                        className="p-1.5 rounded-lg border border-border-color text-muted-fg hover:text-foreground hover:bg-muted-bg cursor-pointer"
                        title="Jump to Trim Start"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-mono text-xs text-foreground font-bold">
                      {currentTime.toFixed(1)}s <span className="text-muted-fg">/ {trimEnd.toFixed(1)}s</span>
                    </div>
                  </div>

                  {/* Scrubber track showing trimmed range */}
                  <div className="relative w-full h-4 flex items-center">
                    <input 
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={0.05}
                      value={currentTime}
                      onChange={(e) => jumpToTime(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer z-20"
                    />
                    {/* Visual Trim Highlight Bar behind scrubber */}
                    <div 
                      className="absolute h-2 bg-primary/25 rounded-full pointer-events-none z-10"
                      style={{
                        left: `${(trimStart / videoDuration) * 100}%`,
                        width: `${((trimEnd - trimStart) / videoDuration) * 100}%`
                      }}
                    />
                  </div>

                  {/* Caption indicator pills */}
                  <div className="flex gap-1.5 overflow-x-auto py-0.5">
                    {captions.map(c => (
                      <button
                        key={c.id}
                        onClick={() => jumpToTime(c.start)}
                        className={`text-[9px] px-2 py-0.5 rounded font-mono truncate max-w-[120px] border transition-colors cursor-pointer ${
                          currentTime >= c.start && currentTime <= c.end
                            ? 'bg-primary text-primary-foreground border-primary font-bold'
                            : 'bg-muted-bg/50 border-border-color text-muted-fg hover:text-foreground'
                        }`}
                        title={`Jump to ${c.start}s`}
                      >
                        {c.start}s: {c.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Captions editor and subtitle styling */}
              <div className="lg:col-span-4 space-y-5">
                <h3 className="text-xs font-bold text-muted-fg uppercase tracking-wider border-b border-border-color pb-2 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" />
                  3. Subtitles & Styling
                </h3>

                {/* Subtitle Aesthetics Panel */}
                <div className="bg-card p-4 rounded-xl border border-border-color space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-muted-fg uppercase flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Typography & Style
                    </h4>
                  </div>

                  {/* Font Family Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-fg font-bold">Font Family</label>
                    <select 
                      value={captionFontFamily} 
                      onChange={(e) => setCaptionFontFamily(e.target.value)}
                      className="w-full bg-card px-2.5 py-1.5 rounded-lg border border-border-color text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      {FONT_FAMILIES.map(f => (
                        <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-fg font-bold">
                      <span>Font Size</span>
                      <span className="font-mono text-primary">{captionFontSize}px</span>
                    </div>
                    <input 
                      type="range" min={12} max={72} step={1}
                      value={captionFontSize}
                      onChange={(e) => setCaptionFontSize(parseInt(e.target.value) || 24)}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                  </div>

                  {/* Text Color & Palette */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted-fg font-bold">
                      <span>Text Color</span>
                      <span className="font-mono text-[10px]">{captionColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={captionColor}
                        onChange={(e) => setCaptionColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border-color cursor-pointer shrink-0"
                      />
                      <div className="flex gap-1 flex-1">
                        {QUICK_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setCaptionColor(c)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              captionColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-primary ring-offset-1' : ''
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Background Color & Opacity */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-muted-fg font-bold">
                      <span>Banner Background</span>
                      <span className="font-mono text-[10px]">
                        {captionBgOpacity === 0 ? 'Transparent' : `${Math.round(captionBgOpacity * 100)}% Opacity`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={captionBgColor}
                          onChange={(e) => setCaptionBgColor(e.target.value)}
                          className="w-8 h-8 rounded border border-border-color cursor-pointer shrink-0"
                        />
                        <span className="text-[10px] font-mono text-muted-fg">{captionBgColor}</span>
                      </div>
                      <input 
                        type="range" min={0} max={1} step={0.05}
                        value={captionBgOpacity}
                        onChange={(e) => setCaptionBgOpacity(parseFloat(e.target.value))}
                        className="w-full accent-primary-600 cursor-pointer"
                        title="Background Opacity"
                      />
                    </div>
                  </div>

                  {/* Text Outline / Shadow & Position */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border-color">
                    <div>
                      <label className="text-[10px] text-muted-fg font-bold block mb-1">Text Shadow</label>
                      <button
                        onClick={() => setCaptionShadow(!captionShadow)}
                        className={`w-full py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          captionShadow
                            ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                            : 'bg-muted-bg/30 border-border-color text-muted-fg'
                        }`}
                      >
                        {captionShadow ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-fg font-bold block mb-1">Position</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['top', 'center', 'bottom'] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => handlePositionPreset(p)}
                            className={`py-1 rounded text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                              captionPos === p
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-muted-bg/30 border-border-color text-muted-fg hover:bg-muted-bg/50'
                            }`}
                          >
                            {p === 'center' ? 'Mid' : p === 'top' ? 'Top' : 'Bot'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtitle Manager and Table */}
                <div className="space-y-3">
                  <span className="text-xs text-muted-fg font-bold block uppercase">Captions Timeline ({captions.length})</span>
                  
                  {/* Add Captions form */}
                  <div className="p-3 bg-card border border-border-color rounded-xl space-y-2.5 shadow-sm">
                    <input 
                      type="text" 
                      placeholder="Type caption text here..." 
                      value={newCapText}
                      onChange={(e) => setNewCapText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCaption(); }}
                      className="w-full bg-card px-3 py-1.5 rounded-lg border border-border-color text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-muted-fg font-bold">Start (s)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={newCapStart} 
                          onChange={(e) => setNewCapStart(parseFloat(e.target.value) || 0)}
                          className="w-full bg-card px-2 py-1 rounded-lg border border-border-color text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-fg font-bold">End (s)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={newCapEnd} 
                          onChange={(e) => setNewCapEnd(parseFloat(e.target.value) || 0)}
                          className="w-full bg-card px-2 py-1 rounded-lg border border-border-color text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <Button variant="primary" size="sm" className="w-full text-xs font-bold cursor-pointer" onClick={addCaption}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Caption at Timestamp
                    </Button>
                  </div>

                  {/* List of current subtitles */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {captions.map((cap) => {
                      const isCurrent = currentTime >= cap.start && currentTime <= cap.end;
                      return (
                        <div 
                          key={cap.id} 
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all shadow-sm ${
                            isCurrent 
                              ? 'bg-primary-50/60 dark:bg-primary-950/30 border-primary' 
                              : 'bg-card border-border-color'
                          }`}
                        >
                          <button
                            onClick={() => jumpToTime(cap.start)}
                            className="min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <p className="font-bold text-foreground truncate">"{cap.text}"</p>
                            <span className="text-[10px] text-muted-fg font-mono block mt-0.5">
                              {cap.start}s – {cap.end}s ({(cap.end - cap.start).toFixed(1)}s)
                            </span>
                          </button>
                          <button 
                            onClick={() => removeCaption(cap.id)} 
                            className="p-1 text-muted-fg hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                            title="Delete Caption"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Export Quality, Performance Notice, Settings Impact, and Warnings */}
            <div className="pt-6 border-t border-border-color space-y-4">
              <div className="p-4 bg-muted-bg/40 border border-border-color rounded-2xl space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-left flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      Video is re-encoded in browser. Quality may differ slightly from original.
                    </p>
                    <p className="text-[11px] text-muted-fg leading-relaxed">
                      Utilizing high-bitrate frame capture with hardware synchronization to preserve smooth motion and sharpness.
                    </p>
                  </div>
                </div>

                {/* 3. SETTINGS IMPACT NOTICE */}
                <div className="p-3 bg-card border border-border-color/80 rounded-xl space-y-1.5 text-left shadow-2xs">
                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Export Speed & Quality Guide
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted-bg/50 border border-border-color/50">
                      <span className="text-xs shrink-0">🚀</span>
                      <div>
                        <p className="font-semibold text-foreground text-[11px]">30 FPS + 5 Mbps</p>
                        <p className="text-[11px] text-muted-fg">Good quality, faster processing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted-bg/50 border border-border-color/50">
                      <span className="text-xs shrink-0">✨</span>
                      <div>
                        <p className="font-semibold text-foreground text-[11px]">60 FPS + 8 Mbps</p>
                        <p className="text-[11px] text-muted-fg">Best quality, slower processing</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border-color/60 text-xs text-left">
                  {/* Bitrate Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-fg font-bold block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> Target Bitrate
                    </label>
                    <select
                      value={exportBitrate}
                      onChange={(e) => setExportBitrate(Number(e.target.value))}
                      className="w-full bg-card px-2.5 py-1.5 rounded-lg border border-border-color text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      <option value={8000000}>8 Mbps (High Quality - Default)</option>
                      <option value={12000000}>12 Mbps (Ultra Crisp)</option>
                      <option value={5000000}>5 Mbps (Standard / Faster)</option>
                    </select>
                  </div>

                  {/* Frame Rate Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-fg font-bold block flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-blue-500" /> Frame Rate
                    </label>
                    <select
                      value={exportFps}
                      onChange={(e) => setExportFps(Number(e.target.value))}
                      className="w-full bg-card px-2.5 py-1.5 rounded-lg border border-border-color text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      <option value={60}>60 FPS (Silky Smooth - Default)</option>
                      <option value={30}>30 FPS (Standard / Faster)</option>
                    </select>
                  </div>

                  {/* Synchronized Engine Badge */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-fg font-bold block">Capture Engine</label>
                    <div className="px-2.5 py-1.5 rounded-lg bg-card border border-border-color text-[11px] font-mono text-foreground truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                      {typeof HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in HTMLVideoElement.prototype 
                        ? 'requestVideoFrameCallback' 
                        : 'requestAnimationFrame'}
                    </div>
                  </div>

                  {/* Format Badge */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-fg font-bold block">Output Container</label>
                    <div className="px-2.5 py-1.5 rounded-lg bg-card border border-border-color text-[11px] font-mono text-foreground truncate">
                      {getBestSupportedMimeType().isMp4 ? 'MP4 (H.264 / AVC)' : 'WebM (VP9)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. BEFORE EXPORT NOTICE: Prominent clear banner */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start sm:items-center gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">
                    ⚠️ Processing may take 1-3 minutes depending on video length and quality settings.
                  </p>
                  <p className="text-[11px] text-muted-fg mt-0.5">
                    Please keep this tab open and active while the video renders.
                  </p>
                </div>
              </div>

              {/* Bottom Actions for rendering the custom workspace */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-left text-xs text-muted-fg">
                  Estimated output: <span className="font-semibold text-foreground font-mono">
                    {aspectRatio === '9_16' ? '1080 × 1920' : aspectRatio === '1_1' ? '1080 × 1080' : '1920 × 1080'}
                  </span> • <span className="font-semibold text-foreground font-mono">{(exportBitrate / 1000000).toFixed(0)} Mbps</span> @ <span className="font-semibold text-foreground font-mono">{exportFps} FPS</span>
                </div>
                
                {/* 5. TIP TOOLTIP ON EXPORT BUTTON */}
                <div className="relative group inline-block">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleExport}
                    className="w-full sm:w-auto font-black text-xs h-12 px-8 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    Render & Export Video
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  
                  {/* Tooltip Card on Hover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[11px] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 text-center leading-relaxed">
                    <span className="font-bold block mb-0.5">💡 Export Speed Tip</span>
                    For faster export, use 30 FPS and 5 Mbps. For best quality, use 60 FPS and 8 Mbps.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Processing Render State */}
        {step === 'rendering' && processing && (
          <div className="w-full max-w-md mx-auto py-10 space-y-6 text-center animate-fade-in">
            <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>

            {/* 2. DURING EXPORT: Clear titles and warning */}
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-foreground">Rendering video... Please wait</h4>
              <p className="text-xs text-muted-fg max-w-xs mx-auto leading-relaxed">
                Capturing canvas frames at {exportFps} FPS with {(exportBitrate / 1000000).toFixed(0)} Mbps bitrate.
              </p>
            </div>

            {/* Warning banner: Do not close tab */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Do not close or refresh this tab while rendering</span>
            </div>

            {/* Progress Bar (0-100%) */}
            <div className="space-y-2">
              <div className="w-full bg-muted-bg rounded-full h-3 overflow-hidden border border-border-color">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-fg font-mono px-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {estimatedTimeRemaining}
                </span>
                <span className="font-bold text-primary">{progress}% Encoded</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Successful export report */}
        {step === 'export' && result && (
          <div className="w-full max-w-xl mx-auto space-y-6 text-center animate-fade-in py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-black text-foreground tracking-tight">Social Video Exported!</h4>
              
              {/* 4. AFTER EXPORT: Video exported successfully in [X] seconds */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Video exported successfully in {result.durationSeconds || exportDurationSeconds || 'a few'} seconds</span>
              </div>

              <p className="text-xs text-muted-fg leading-relaxed max-w-xs mx-auto pt-1">
                Your video has been cropped, formatted, captioned, and rendered completely offline using browser stream captures.
              </p>
            </div>

            {/* Video container matching aspect ratio */}
            <div className={`relative border border-border-color rounded-2xl overflow-hidden bg-black flex items-center justify-center mx-auto shadow-md ${
              aspectRatio === '9_16' 
                ? 'w-full max-w-[220px] aspect-[9/16]' 
                : aspectRatio === '1_1' 
                  ? 'w-full max-w-[280px] aspect-square' 
                  : 'w-full max-w-[420px] aspect-video'
            }`}>
              <video 
                ref={exportVideoRef}
                src={result.downloadUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Detailed Export Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left bg-card p-3.5 rounded-2xl border border-border-color max-w-md mx-auto text-xs shadow-xs">
              <div>
                <span className="text-[10px] text-muted-fg block font-medium">Resolution</span>
                <span className="font-bold text-foreground font-mono">{result.resolution}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-fg block font-medium">Bitrate</span>
                <span className="font-bold text-primary font-mono">{result.bitrate}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-fg block font-medium">Frame Rate</span>
                <span className="font-bold text-foreground font-mono">{result.fps}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-fg block font-medium">Format</span>
                <span className="font-bold text-foreground font-mono">{result.format}</span>
              </div>
            </div>

            <div className="pt-2 max-w-xs mx-auto">
              <a href={result.downloadUrl} download={result.downloadFilename}>
                <Button variant="primary" className="w-full h-12 text-xs font-bold cursor-pointer shadow-md">
                  <Download className="w-5 h-5 mr-2 shrink-0" />
                  Download Social Video
                </Button>
              </a>
            </div>

            <div className="pt-2 border-t border-border-color max-w-xs mx-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="text-xs font-semibold cursor-pointer"
              >
                Render Another Video
              </Button>
            </div>
          </div>
        )}
      </ToolLayout>

      {/* Educational content section */}
      <section className="container mx-auto max-w-4xl px-4 py-16 space-y-12 text-left">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Turn standard videos into shorts with styled captions</h2>
          <p className="text-muted-fg mt-2 leading-relaxed text-sm">
            The Calcora Social Video Maker speeds up content scaling by letting creators crop videos into vertical 9:16 or square 1:1 ratios, trim play ranges to stay under time bounds, and design eye-catching caption cards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-muted-fg">
          <div className="space-y-3">
            <h3 className="font-bold text-foreground uppercase text-sm text-primary">Precision Trimming</h3>
            <p className="leading-relaxed">
              Define precise start and end times in seconds to cut out intro headers or unwanted silence ranges. Captions are matched against the video timeline automatically.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-foreground uppercase text-sm text-primary">Local Storage Privacy</h3>
            <p className="leading-relaxed">
              Videos are parsed, rendered, and compiled completely in client memory using Canvas recording APIs. There are no server uploads, keeping user-authored drafts private.
            </p>
          </div>
        </div>
      </section>

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-color rounded-3xl p-6 max-w-md w-full shadow-lg space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-extrabold text-foreground font-display">Daily Free Limit Reached</h3>
                <p className="text-xs text-muted-fg mt-1">
                  You have consumed your 5 free daily uses across the Calcora tool suite.
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted-bg/50 rounded-xl border border-border-color text-xs text-left space-y-2">
              <p className="text-foreground font-semibold">Unlock Higher Fair-Use Limits</p>
              <p className="text-muted-fg">
                Get up to 500 actions/day, larger spreadsheet support, unlimited batch sizes for product photos, and high-res vertical social video exports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/pricing');
                }}
                className="flex-1 py-2.5 px-4 text-xs font-bold bg-primary hover:bg-primary-600 text-white rounded-xl transition-all cursor-pointer"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="py-2.5 px-4 text-xs font-bold bg-secondary border border-border-color text-foreground rounded-xl hover:bg-muted-bg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};
