import React, { useState } from 'react';
import heic2any from 'heic2any';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';

export const ImageConverter = () => {
  const tool = getToolById('image-converter');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();

  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  const getExtension = (mime: string) => {
    switch (mime) {
      case 'image/jpeg': return 'jpg';
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
      default: return 'jpg';
    }
  };

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
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setProcessing(true);
    setError(undefined);
    
    try {
      const img = new Image();
      
      let imgSrc = URL.createObjectURL(file);
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
        });
        const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        imgSrc = URL.createObjectURL(blobToUse);
      }
      
      img.src = imgSrc;

      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas not supported");
      
      // Fill white background in case converting transparent PNG to JPG
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Could not create blob");
        const url = URL.createObjectURL(blob);
        const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + getExtension(targetFormat);
        setResult({
          downloadUrl: url,
          downloadFilename: newName,
          message: `Successfully converted to ${getExtension(targetFormat).toUpperCase()}`
        });
        setProcessing(false);
      }, targetFormat, 0.9);
      
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
        accept="image/*,.heic"
        onFileSelect={handleFileSelect}
        processing={processing}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={file && !result ? handleProcess : undefined}
      >
        {file && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground">
                <span className="font-semibold block">{file.name}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-4">Convert to:</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'image/jpeg', label: 'JPG' },
                  { value: 'image/png', label: 'PNG' },
                  { value: 'image/webp', label: 'WebP' }
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
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
