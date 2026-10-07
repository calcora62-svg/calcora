import React, { useState, useRef, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { getToolById } from '../../data/tools';
import { Button } from '../../components/ui/Button';
import { UploadCloud, Video, Camera, RefreshCw, Download } from 'lucide-react';

export const VideoToThumbnail = () => {
  const tool = getToolById('video-to-thumbnail');

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  
  // Controls
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setCapturedBlob(null);
      setCapturedUrl(null);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type.startsWith('video/')) {
        setFile(selected);
      }
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not obtain 2D canvas context');

      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create thumbnail blob from frame');
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);

        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(url);
      }, format, 0.95);

    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
  };

  if (!tool) return null;

  return (
    <ToolWrapper tool={tool}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{tool.name}</h1>
          <p className="text-muted-fg">{tool.description}</p>
        </div>

        {!file ? (
          <div 
            className="border-2 border-dashed rounded-3xl p-12 text-center border-border-color bg-card hover:border-primary-400 hover:bg-muted-bg/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Upload your video</h3>
            <p className="text-muted-fg mb-4">Select an MP4, WebM, or other local browser-supported video file</p>
            <p className="text-xs text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full font-semibold">
              100% Client-Side Processing
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="video/mp4, video/webm, video/ogg"
              onChange={handleFileSelect} 
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Player Controls */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2 border-b border-border-color pb-2">
                  <Video className="w-5 h-5 text-primary-600" />
                  Video Player Timeline
                </h3>
                
                <div className="bg-black rounded-2xl overflow-hidden aspect-video border border-border-color flex items-center justify-center relative">
                  {videoUrl && (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      preload="auto"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                      onLoadedMetadata={() => {
                        if (videoRef.current) setDuration(videoRef.current.duration);
                      }}
                      onTimeUpdate={() => {
                        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                      }}
                    />
                  )}
                </div>

                <div className="bg-muted-bg/20 p-4 rounded-xl flex items-center justify-between text-xs text-muted-fg font-medium">
                  <span>Width: {videoRef.current?.videoWidth || '...'} px</span>
                  <span>Height: {videoRef.current?.videoHeight || '...'} px</span>
                  <span>Duration: {duration ? `${duration.toFixed(1)}s` : '...'}</span>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button variant="primary" className="flex-1 shadow-sm" onClick={handleCaptureFrame}>
                    <Camera className="w-4 h-4 mr-2" />
                    Grab Current Frame
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Right Column: Frame Output */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2 border-b border-border-color pb-2">
                  <Camera className="w-5 h-5 text-primary-600" />
                  Captured Thumbnail
                </h3>

                {capturedUrl ? (
                  <div className="space-y-4">
                    <div className="bg-muted-bg/30 rounded-2xl p-4 flex items-center justify-center aspect-video border border-border-color overflow-hidden relative">
                      <img src={capturedUrl} alt="Captured frame thumbnail" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Download Format</label>
                        <select
                          value={format}
                          onChange={(e) => setFormat(e.target.value as any)}
                          className="w-full p-2.5 rounded-lg border border-border-color bg-background text-foreground text-sm font-medium"
                        >
                          <option value="image/png">PNG (Lossless / High Res)</option>
                          <option value="image/jpeg">JPEG (Compact Size)</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <a 
                          href={capturedUrl} 
                          download={`captured_frame_${currentTime.toFixed(2)}s.${format === 'image/png' ? 'png' : 'jpg'}`}
                          className="w-full"
                        >
                          <Button variant="primary" className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border-color rounded-2xl flex flex-col items-center justify-center p-12 text-center aspect-video text-muted-fg text-sm">
                    <Camera className="w-8 h-8 mb-2 opacity-40" />
                    <p>Scrub video on the left, then click</p>
                    <p className="font-semibold text-primary-600 mt-1">"Grab Current Frame"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};
