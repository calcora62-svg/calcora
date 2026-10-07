import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { usePlanStore } from '../../store/usePlanStore';

// Set up PDF.js worker using unpkg CDN matching the installed version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfToJpg = () => {
  const tool = getToolById('pdf-to-jpg');
  const { consumeUsage, canUseTool } = usePlanStore();

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; downloadFilename: string; message: string } | undefined>();
  const [error, setError] = useState<string>();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      if (files[0].type !== 'application/pdf' && !files[0].name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file.');
        return;
      }
      setFile(files[0]);
      setError(undefined);
      setResult(undefined);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(undefined);
    setError(undefined);
    setProgress(0);
    setProcessing(false);
  };

  const handleProcess = async () => {
    if (!file) return;

    if (!canUseTool('pdf-to-jpg')) {
      setError("You've reached your daily usage limit. Please upgrade your plan.");
      return;
    }

    setProcessing(true);
    setError(undefined);
    setProgress(5);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      if (totalPages === 0) {
        throw new Error('This PDF file has no pages.');
      }

      const renderedJpgs: { name: string; blob: Blob }[] = [];
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        // 2x scale for sharp output
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!context) {
          throw new Error('Could not create canvas context for rendering.');
        }

        // Fill white background for JPEG rendering so transparent backgrounds are clean white
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: context, viewport, canvas } as any).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.92);
        });

        if (blob) {
          renderedJpgs.push({
            name: `${baseName}_page_${pageNum}.jpg`,
            blob,
          });
        }

        setProgress(Math.round((pageNum / totalPages) * 90));
      }

      if (renderedJpgs.length === 0) {
        throw new Error('Could not convert any pages to JPG.');
      }

      let downloadBlob: Blob;
      let downloadFilename: string;
      let message: string;

      if (renderedJpgs.length === 1) {
        // Single page -> direct JPG
        downloadBlob = renderedJpgs[0].blob;
        downloadFilename = renderedJpgs[0].name;
        message = 'Successfully converted 1 page to JPG!';
      } else {
        // Multiple pages -> ZIP archive
        const zip = new JSZip();
        for (const item of renderedJpgs) {
          zip.file(item.name, item.blob);
        }
        downloadBlob = await zip.generateAsync({ type: 'blob' });
        downloadFilename = `${baseName}_jpg_pages.zip`;
        message = `Successfully converted all ${renderedJpgs.length} pages and packaged into a ZIP archive!`;
      }

      setProgress(100);
      const url = URL.createObjectURL(downloadBlob);
      setResult({
        downloadUrl: url,
        downloadFilename,
        message,
      });

      consumeUsage('pdf-to-jpg');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while converting the PDF to JPG.');
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
        progress={progress}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={file && !result ? handleProcess : undefined}
      >
        {file && (
          <div className="space-y-4">
            <div className="p-4 bg-muted-bg rounded-xl text-sm text-foreground flex items-center justify-between">
              <div>
                <span className="font-semibold block">{file.name}</span>
                <span className="text-muted-fg text-xs block mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600">
                Ready to Convert
              </span>
            </div>
            <p className="text-xs text-muted-fg text-center">
              Files are converted securely in your browser. Single-page PDFs download as JPG; multi-page PDFs download as a ZIP.
            </p>
          </div>
        )}
      </ToolLayout>
    </ToolWrapper>
  );
};
