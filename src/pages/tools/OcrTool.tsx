import React, { useState } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { Copy, CheckCircle2, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { usePlanStore } from '../../store/usePlanStore';

export const OcrTool = () => {
  const tool = getToolById('ocr-image-pdf-to-text');
  
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultText, setResultText] = useState<string>('');
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      const isImage = selected.type.startsWith('image/');
      const isPdf = selected.type === 'application/pdf' || selected.name.endsWith('.pdf');

      if (!isImage && !isPdf) {
        setError('Please select a valid image (PNG, JPG, WebP) or a PDF file.');
        return;
      }
      setFile(selected);
      setError(undefined);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultText('');
    setError(undefined);
    setProgress(0);
    setCopied(false);
  };

  const handleProcess = async () => {
    if (!file) return;

    // FIX 1: Check if user has uses remaining before processing
    const canUse = usePlanStore.getState().canUseTool('ocr-image-pdf-to-text');
    if (!canUse) {
      setError('Daily free limit reached. Please upgrade to Premium for more uses.');
      return;
    }
    
    setProcessing(true);
    setError(undefined);
    setProgress(1);
    
    try {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (isPdf) {
        // PDF multi-page OCR
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        let combinedText = '';
        const Tesseract = (await import('tesseract.js')).default;

        for (let p = 1; p <= numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

          const result = await Tesseract.recognize(
            canvas,
            'eng',
            {
              logger: m => {
                if (m.status === 'recognizing text') {
                  const pageProgress = Math.round(
                    ((p - 1) / numPages) * 100 + (m.progress * 100) / numPages
                  );
                  setProgress(pageProgress);
                }
              }
            }
          );

          combinedText += `--- Page ${p} ---\n${result.data.text}\n\n`;
        }

        setResultText(combinedText.trim());
        setProgress(100);
      } else {
        // Image OCR (Existing)
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setProgress(Math.round(m.progress * 100));
              }
            }
          }
        );
        
        setResultText(result.data.text);
        setProgress(100);
      }

      // FIX 2: Consume usage only after successful OCR
      usePlanStore.getState().consumeUsage('ocr-image-pdf-to-text');
      
    } catch (err: any) {
      console.error(err);
      setError('OCR processing failed. The file layout might be too complex or unreadable.');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsTxt = () => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'extracted_text';
    a.download = `${baseName}_ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!tool) return null;

  const resultNode = resultText ? (
    <div className="w-full bg-card border border-border-color rounded-2xl p-6 shadow-sm text-left mt-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Extracted Text</h3>
          <p className="text-xs text-muted-fg">You can edit the text directly before copying or downloading.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>
          <Button variant="primary" size="sm" onClick={downloadAsTxt}>
            <Download className="w-4 h-4 mr-1.5" />
            Download .txt
          </Button>
        </div>
      </div>
      <textarea
        value={resultText}
        onChange={(e) => setResultText(e.target.value)}
        placeholder="Extracted text will appear here..."
        className="w-full h-64 p-4 rounded-xl border border-border-color bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  ) : undefined;

  return (
    <ToolWrapper tool={tool}>
      <ToolLayout
        toolId={tool.id}
        title={tool.name}
        description={tool.description}
        accept="image/*,application/pdf"
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={progress}
        result={resultText ? { message: 'Text extracted successfully!' } : undefined}
        resultNode={resultNode}
        error={error}
        onReset={handleReset}
        onProcess={file && !resultText ? handleProcess : undefined}
      >
        {file && !resultText && (
          <div className="space-y-4 text-center">
            <div className="p-3 bg-muted-bg rounded-lg text-sm text-foreground inline-block">
              <span className="font-semibold block">{file.name}</span>
            </div>
            <p className="text-xs text-muted-fg">Processing runs securely in your browser using local AI (Tesseract.js).</p>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};