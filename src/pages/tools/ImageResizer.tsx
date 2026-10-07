import React, { useState } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

export const ImageResizer = () => {
  const tool = getToolById('image-resizer');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();

  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [originalAspect, setOriginalAspect] = useState<number>(1);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (!files[0].type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setFile(files[0]);
      setError(undefined);
      
      const img = new Image();
      img.onload = () => {
        setWidth(img.width.toString());
        setHeight(img.height.toString());
        setOriginalAspect(img.width / img.height);
        setImgObj(img);
      };
      img.src = URL.createObjectURL(files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(undefined);
    setError(undefined);
    setImgObj(null);
    setWidth('');
    setHeight('');
  };

  const handleWidthChange = (val: string) => {
    setWidth(val);
    if (maintainRatio && val && !isNaN(Number(val))) {
      setHeight(Math.round(Number(val) / originalAspect).toString());
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    if (maintainRatio && val && !isNaN(Number(val))) {
      setWidth(Math.round(Number(val) * originalAspect).toString());
    }
  };

  const handleProcess = async () => {
    if (!file || !imgObj) return;
    
    const targetW = parseInt(width);
    const targetH = parseInt(height);
    
    if (isNaN(targetW) || isNaN(targetH) || targetW <= 0 || targetH <= 0) {
      setError('Please enter valid dimensions.');
      return;
    }

    // FIX 1: Check if user has uses remaining before processing
    const canUse = usePlanStore.getState().canUseTool('image-resizer');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }

    setProcessing(true);
    setError(undefined);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas not supported");
      
      ctx.drawImage(imgObj, 0, 0, targetW, targetH);
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Could not create blob");
        const url = URL.createObjectURL(blob);
        setResult({
          downloadUrl: url,
          downloadFilename: `resized_${file.name}`,
          message: `Successfully resized to ${targetW} × ${targetH} pixels.`
        });

        // FIX 2: Consume usage only after successful resize
        usePlanStore.getState().consumeUsage('image-resizer');
        
        setProcessing(false);
      }, file.type);
      
    } catch (err) {
      console.error(err);
      setError('Something went wrong while processing this file. Please try again.');
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
        {file && imgObj && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground">
                <span className="font-semibold block">{file.name}</span>
                Original: {imgObj.width} × {imgObj.height}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Width (px)</label>
                <input 
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Height (px)</label>
                <input 
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="maintainRatio" 
                checked={maintainRatio} 
                onChange={(e) => setMaintainRatio(e.target.checked)}
                className="w-4 h-4 accent-primary-600 rounded border-border-color bg-background text-primary-600"
              />
              <label htmlFor="maintainRatio" className="text-sm font-medium text-foreground">
                Maintain aspect ratio
              </label>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};