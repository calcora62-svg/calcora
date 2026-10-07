import React, { useState, useEffect, useRef } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { Button } from '../../components/ui/Button';

export const ImageCropper = () => {
  const tool = getToolById('image-cropper');

  const [file, setFile] = useState<File | null>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    downloadUrl: string;
    downloadFilename: string;
    message: string;
  } | undefined>();
  const [error, setError] = useState<string>();

  // Cropper parameters
  const [aspectRatio, setAspectRatio] = useState<string>('16:9'); // '16:9' | '1:1' | '4:5' | '9:16' | 'free'
  const [zoom, setZoom] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0); // percentages (-100 to 100)
  const [offsetY, setOffsetY] = useState<number>(0); // percentages (-100 to 100)
  const [rotation, setRotation] = useState<number>(0); // degrees (-180 to 180)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
        // Reset cropper controls
        setZoom(1.0);
        setOffsetX(0);
        setOffsetY(0);
        setRotation(0);
      };
      img.onerror = () => {
        setError('Could not load this image file.');
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

  // Draw preview canvas
  useEffect(() => {
    if (!imgObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define target size for preview
    let targetW = 400;
    let targetH = 225; // 16:9 default

    if (aspectRatio === '1:1') {
      targetW = 300;
      targetH = 300;
    } else if (aspectRatio === '4:5') {
      targetW = 280;
      targetH = 350;
    } else if (aspectRatio === '9:16') {
      targetW = 225;
      targetH = 400;
    } else if (aspectRatio === 'free') {
      // Fit to image's aspect ratio
      const imgAspect = imgObj.width / imgObj.height;
      if (imgAspect > 1) {
        targetW = 400;
        targetH = Math.round(400 / imgAspect);
      } else {
        targetH = 350;
        targetW = Math.round(350 * imgAspect);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.save();

    // Center of canvas
    ctx.translate(targetW / 2, targetH / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scaling / zoom
    ctx.scale(zoom, zoom);

    // Draw image centered with offsets
    const imgAspect = imgObj.width / imgObj.height;
    const canvasAspect = targetW / targetH;
    let drawW = targetW;
    let drawH = targetH;

    if (imgAspect > canvasAspect) {
      // Image is wider
      drawH = targetH;
      drawW = targetH * imgAspect;
    } else {
      // Image is taller
      drawW = targetW;
      drawH = targetW / imgAspect;
    }

    // Convert percentage offsets to pixels relative to draw dimensions
    const pxOffsetX = (offsetX / 100) * drawW;
    const pxOffsetY = (offsetY / 100) * drawH;

    ctx.drawImage(imgObj, -drawW / 2 + pxOffsetX, -drawH / 2 + pxOffsetY, drawW, drawH);
    ctx.restore();

    // Add visual border framing guide
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, targetW, targetH);

  }, [imgObj, aspectRatio, zoom, offsetX, offsetY, rotation]);

  const handleProcess = async () => {
    if (!file || !imgObj) return;
    setProcessing(true);
    setError(undefined);

    try {
      const canvas = document.createElement('canvas');
      
      // Determine high-resolution output bounds matching the chosen aspect ratio
      let outputW = imgObj.width;
      let outputH = imgObj.height;

      if (aspectRatio === '16:9') {
        outputH = Math.round(outputW / (16 / 9));
        if (outputH > imgObj.height) {
          outputH = imgObj.height;
          outputW = Math.round(outputH * (16 / 9));
        }
      } else if (aspectRatio === '1:1') {
        outputW = Math.min(imgObj.width, imgObj.height);
        outputH = outputW;
      } else if (aspectRatio === '4:5') {
        outputH = Math.round(outputW / (4 / 5));
        if (outputH > imgObj.height) {
          outputH = imgObj.height;
          outputW = Math.round(outputH * (4 / 5));
        }
      } else if (aspectRatio === '9:16') {
        outputH = Math.round(outputW / (9 / 16));
        if (outputH > imgObj.height) {
          outputH = imgObj.height;
          outputW = Math.round(outputH * (9 / 16));
        }
      }

      canvas.width = outputW;
      canvas.height = outputH;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not obtain canvas context.');

      ctx.save();
      ctx.translate(outputW / 2, outputH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const imgAspect = imgObj.width / imgObj.height;
      const canvasAspect = outputW / outputH;
      let drawW = outputW;
      let drawH = outputH;

      if (imgAspect > canvasAspect) {
        drawH = outputH;
        drawW = outputH * imgAspect;
      } else {
        drawW = outputW;
        drawH = outputW / imgAspect;
      }

      const pxOffsetX = (offsetX / 100) * drawW;
      const pxOffsetY = (offsetY / 100) * drawH;

      ctx.drawImage(imgObj, -drawW / 2 + pxOffsetX, -drawH / 2 + pxOffsetY, drawW, drawH);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to export cropped image.');
        const downloadUrl = URL.createObjectURL(blob);
        setResult({
          downloadUrl,
          downloadFilename: `cropped_${Date.now()}_${file.name}`,
          message: `Successfully cropped image to ${outputW}x${outputH} (${aspectRatio}) pixel boundary.`
        });
        setProcessing(false);
      }, file.type, 0.9);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while cropping image.');
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
            {/* Visual Canvas Panel */}
            <div className="flex flex-col items-center bg-muted-bg/30 p-6 rounded-2xl">
              <h4 className="text-xs font-bold text-muted-fg uppercase tracking-wider mb-4">Preview Crop Frame</h4>
              <div className="bg-card p-4 rounded-xl border border-border-color shadow-sm flex items-center justify-center min-h-[420px] w-full max-w-lg overflow-hidden">
                <canvas ref={canvasRef} className="max-w-full max-h-[380px] object-contain shadow-md rounded" />
              </div>
            </div>

            {/* Form Controls */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Aspect Ratio select */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-fg uppercase tracking-wider">Crop Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Free', '16:9', '1:1', '4:5', '9:16'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r.toLowerCase())}
                      className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                        aspectRatio === r.toLowerCase() ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'border-border-color hover:bg-muted-bg'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-muted-fg uppercase tracking-wider">Crop Zoom</label>
                  <span className="font-semibold text-primary-600">{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-primary-600 mt-2"
                />
              </div>

              {/* Offset X Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-muted-fg uppercase tracking-wider">Horizontal Position Offset</label>
                  <span className="font-semibold text-primary-600">{offsetX > 0 ? `+${offsetX}` : offsetX}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value))}
                  className="w-full accent-primary-600 mt-2"
                />
              </div>

              {/* Offset Y Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-muted-fg uppercase tracking-wider">Vertical Position Offset</label>
                  <span className="font-semibold text-primary-600">{offsetY > 0 ? `+${offsetY}` : offsetY}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value))}
                  className="w-full accent-primary-600 mt-2"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-semibold text-muted-fg uppercase tracking-wider">Image Rotation</label>
                  <span className="font-semibold text-primary-600">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-primary-600 mt-2"
                />
              </div>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
