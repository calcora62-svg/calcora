import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

export const ImageToPdf = ({ toolId = 'image-to-pdf' }) => {
  const tool = getToolById(toolId);
  
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();

  const handleFileSelect = (newFiles: File[]) => {
    const validImages = newFiles.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      setError('Please select valid image files.');
      return;
    }
    setFiles(prev => [...prev, ...validImages]);
    setError(undefined);
  };

  const handleReset = () => {
    setFiles([]);
    setResult(undefined);
    setError(undefined);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= files.length - 1) return;
    setFiles(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    // FIX 1: Check if user has uses remaining before processing
    const canUse = usePlanStore.getState().canUseTool(toolId);
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }
    
    setProcessing(true);
    setError(undefined);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          // If webp or other, we need to convert to PNG first via Canvas
          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise((resolve) => { img.onload = resolve; });
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
            if (blob) {
              const buf = await blob.arrayBuffer();
              image = await pdfDoc.embedPng(buf);
            }
          }
        }
        
        if (image) {
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      setResult({
        downloadUrl: URL.createObjectURL(blob),
        downloadFilename: 'converted_images.pdf',
        message: `Successfully combined ${files.length} images into a PDF.`
      });

      // FIX 2: Consume usage only after successful conversion
      usePlanStore.getState().consumeUsage(toolId);
      
    } catch (err) {
      console.error(err);
      setError('Something went wrong while creating the PDF.');
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
        onProcess={files.length > 0 && !result ? handleProcess : undefined}
        multiple={true}
      >
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Selected Images in PDF Page Order ({files.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((f, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-muted-bg rounded-xl text-sm text-foreground gap-2">
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-background font-semibold text-xs text-muted-fg shrink-0 border border-border-color">
                      {idx + 1}
                    </span>
                    <span className="truncate">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveUp(idx)}
                      className="p-1.5 rounded-lg text-muted-fg hover:text-foreground hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === files.length - 1}
                      onClick={() => moveDown(idx)}
                      className="p-1.5 rounded-lg text-muted-fg hover:text-foreground hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};