import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

export const PdfMerger = () => {
  const tool = getToolById('pdf-merger');
  
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();

  const handleFileSelect = (newFiles: File[]) => {
    const validPdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length === 0) {
      setError('Please select valid PDF files.');
      return;
    }
    setFiles(prev => [...prev, ...validPdfs]);
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
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }

    // FIX 1: Check if user has uses remaining before processing
    const canUse = usePlanStore.getState().canUseTool('pdf-merger');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }
    
    setProcessing(true);
    setError(undefined);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setResult({
        downloadUrl: url,
        downloadFilename: 'merged_document.pdf',
        message: `Successfully merged ${files.length} PDFs into one document.`
      });

      // FIX 2: Consume usage only after successful merge
      usePlanStore.getState().consumeUsage('pdf-merger');
      
    } catch (err) {
      console.error(err);
      setError('Something went wrong while merging PDFs. Please check if the files are corrupted or password protected.');
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
        accept="application/pdf"
        onFileSelect={handleFileSelect}
        processing={processing}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={files.length > 1 && !result ? handleProcess : undefined}
        multiple={true}
      >
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Selected Files in Merge Order ({files.length})</h4>
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
            {files.length < 2 && (
              <p className="text-sm text-amber-600 font-medium">Please add at least one more PDF to merge.</p>
            )}
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};