import React, { useState } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

export const PdfSplitter = () => {
  const tool = getToolById('pdf-splitter');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();
  
  const [pagesStr, setPagesStr] = useState<string>('');

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (files[0].type !== 'application/pdf') {
        setError('Please select a valid PDF file.');
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
    setPagesStr('');
  };

  const handleProcess = async () => {
    if (!file) return;

    // FIX 1: Check if user has uses remaining before processing
    const canUse = usePlanStore.getState().canUseTool('pdf-splitter');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }
    
    setProcessing(true);
    setError(undefined);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      
      let pagesToExtract: number[] = [];
      if (!pagesStr.trim()) {
        pagesToExtract = Array.from({ length: totalPages }, (_, i) => i);
      } else {
        const parts = pagesStr.split(',').map(p => p.trim());
        for (const p of parts) {
          if (p.includes('-')) {
            const [start, end] = p.split('-').map(n => parseInt(n));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
              }
            }
          } else {
            const num = parseInt(p);
            if (!isNaN(num) && num >= 1 && num <= totalPages) {
              pagesToExtract.push(num - 1);
            }
          }
        }
      }
      
      pagesToExtract = Array.from(new Set(pagesToExtract)).sort((a, b) => a - b);
      
      if (pagesToExtract.length === 0) {
        throw new Error("No valid pages selected.");
      }

      if (pagesToExtract.length === 1) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pagesToExtract[0]]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setResult({
          downloadUrl: URL.createObjectURL(blob),
          downloadFilename: `page_${pagesToExtract[0] + 1}_${file.name}`,
          message: `Successfully extracted page ${pagesToExtract[0] + 1}.`
        });
      } else {
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
        copiedPages.forEach(p => newPdf.addPage(p));
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setResult({
          downloadUrl: URL.createObjectURL(blob),
          downloadFilename: `extracted_${file.name}`,
          message: `Successfully extracted ${pagesToExtract.length} pages.`
        });
      }

      // FIX 2: Consume usage only after successful split
      usePlanStore.getState().consumeUsage('pdf-splitter');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while splitting the PDF.');
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
        onProcess={file && !result ? handleProcess : undefined}
      >
        {file && (
          <div className="space-y-4">
            <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground">
              <span className="font-semibold block">{file.name}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Pages to Extract (e.g. 1, 3-5, 8)</label>
              <input 
                type="text"
                value={pagesStr}
                onChange={(e) => setPagesStr(e.target.value)}
                placeholder="Leave blank to extract all pages"
                className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground"
              />
              <p className="text-xs text-muted-fg mt-2">
                Note: Leaving it blank will currently pack all pages into one PDF. Specify comma-separated pages or ranges.
              </p>
            </div>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};