import React, { useState, useRef, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

// Browser-local pixel propagation inpainting algorithm
const inpaintCanvas = (
  ctx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  width: number,
  height: number
) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return;

  const maskData = maskCtx.getImageData(0, 0, width, height);
  const pixels = imgData.data;
  const mask = maskData.data;

  // Mark masked pixels based on red channel threshold
  const isMasked = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = mask[i * 4];
    const a = mask[i * 4 + 3];
    if (a > 10 && r > 200) {
      isMasked[i] = 1;
    }
  }

  const tempPixels = new Uint8ClampedArray(pixels);
  let maskedCount = 1;
  let passes = 0;

  // Iteratively smooth boundary color inwards
  while (maskedCount > 0 && passes < 40) {
    maskedCount = 0;
    const nextIsMasked = new Uint8Array(isMasked);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (isMasked[idx] === 1) {
          maskedCount++;
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          const neighbors = [
            idx - 1, idx + 1,
            idx - width, idx + width,
            idx - width - 1, idx - width + 1,
            idx + width - 1, idx + width + 1
          ];

          for (const n of neighbors) {
            if (isMasked[n] === 0) {
              sumR += tempPixels[n * 4];
              sumG += tempPixels[n * 4 + 1];
              sumB += tempPixels[n * 4 + 2];
              count++;
            }
          }

          if (count > 0) {
            pixels[idx * 4] = Math.round(sumR / count);
            pixels[idx * 4 + 1] = Math.round(sumG / count);
            pixels[idx * 4 + 2] = Math.round(sumB / count);
            pixels[idx * 4 + 3] = 255;
            nextIsMasked[idx] = 0;
          }
        }
      }
    }

    isMasked.set(nextIsMasked);
    tempPixels.set(pixels);
    passes++;
  }

  ctx.putImageData(imgData, 0, 0);
};

export const ObjectRemover = () => {
  const tool = getToolById('object-remover');
  const { consumeUsage, canUseTool } = usePlanStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
    maskCanvasRef.current = null;
  };

  useEffect(() => {
    if (file && canvasRef.current) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Instantiate matching offscreen mask canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        maskCanvasRef.current = maskCanvas;
      };
    }
  }, [file]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw visible stroke
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Draw to mask canvas
    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      if (maskCtx) {
        maskCtx.fillStyle = 'rgb(255, 0, 0)';
        maskCtx.beginPath();
        maskCtx.arc(x, y, 16, 0, Math.PI * 2);
        maskCtx.fill();
      }
    }
  };

  const handleProcess = async () => {
    if (!file || !canvasRef.current || !maskCanvasRef.current) return;
    if (!canUseTool(tool?.id || '')) {
      setError("You've reached your daily limit for this tool. Please upgrade your plan.");
      return;
    }

    setProcessing(true);
    setError(undefined);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not resolve canvas drawing context.");

      // Run our dynamic local inpainting logic
      inpaintCanvas(ctx, maskCanvasRef.current, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      
      setResult({
        downloadUrl: dataUrl,
        downloadFilename: `inpainted_${file.name.replace(/\.[^/.]+$/, "")}.png`,
        message: "Object successfully removed locally using secure browser-based inpainting."
      });
      
      if (tool) {
        consumeUsage(tool.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during local object removal.');
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
        accept="image/*"
        onFileSelect={handleFileSelect}
        processing={processing}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={file && !result ? handleProcess : undefined}
      >
        {file && !result && (
          <div className="space-y-6">
            <p className="text-sm text-muted-fg mb-2">Brush over the object you want to remove:</p>
            <div className="border border-border-color rounded-xl overflow-hidden bg-muted-bg/50 inline-block">
              <canvas
                ref={canvasRef}
                onMouseDown={() => setIsDrawing(true)}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onMouseMove={draw}
                className="cursor-crosshair"
              />
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
