import React, { useState } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Download, RefreshCw, Loader2, ArrowRight, X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { usePlanStore } from '../../store/usePlanStore';
import { getPlanLimits, PRICING_PLANS } from '../../config/pricing';
import { getToolById } from '../../data/tools';
import { trackEvent } from '../../utils/analytics';

interface ToolLayoutProps {
  title: string;
  description: string;
  accept: string;
  onFileSelect: (files: File[]) => void;
  processing: boolean;
  progress?: number;
  result?: {
    originalSize?: number;
    newSize?: number;
    savedPercentage?: number;
    downloadUrl?: string;
    downloadFilename?: string;
    message?: string;
  };
  error?: string;
  onReset: () => void;
  onProcess?: () => void;
  children?: React.ReactNode;
  resultNode?: React.ReactNode;
  multiple?: boolean;
  toolId?: string; // Used to generate "What next?" recommendations
}

export const ToolLayout = ({
  title, description, accept, onFileSelect, processing, progress, result, error, onReset, onProcess, children, resultNode, multiple = false, toolId
}: ToolLayoutProps) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { activePlan, canUseTool, getUsageCount } = usePlanStore();
  const [localPlanError, setLocalPlanError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [dismissedPremiumModalToday, setDismissedPremiumModalToday] = useState(false);

  // Individual tools manage atomic usage consumption upon successful result generation.
  // ToolLayout monitors usage count and displays the upgrade modal when daily limits are reached.
  React.useEffect(() => {
    if (result && toolId) {
      const count = getUsageCount();
      const limits = getPlanLimits(activePlan);
      if (count >= limits.dailyUses && !dismissedPremiumModalToday && !showPremiumModal) {
        setShowPremiumModal(true);
      }
    }
  }, [result, toolId, getUsageCount, activePlan, dismissedPremiumModalToday, showPremiumModal]);

  const planLimits = getPlanLimits(activePlan);
  const planName = PRICING_PLANS[activePlan].name;

  
  const hasNoChildren = !children || React.Children.toArray(children).filter(Boolean).length === 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  
  const handleDragLeave = () => setDragOver(false);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleInterceptFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleInterceptFileSelect = (files: File[]) => {
    setLocalPlanError(null);
    if (!toolId) {
      onFileSelect(files);
      return;
    }
    
    if (!canUseTool(toolId)) {
      setShowPremiumModal(true);
      return;
    }

    if (files.length > 1 && !planLimits.batchProcessing) {
      setLocalPlanError('Batch processing is only available on Pro and above.');
      return;
    }

    const maxBytes = planLimits.maxFileSize * 1024 * 1024;
    for (const f of files) {
      if (f.size > maxBytes) {
         setLocalPlanError(`File size limit is ${planLimits.maxFileSize}MB for the ${planName} plan.`);
         return;
      }
    }

    onFileSelect(files);
  };

  const handleInterceptProcess = () => {
    if (toolId && !canUseTool(toolId)) {
      setShowPremiumModal(true);
      return;
    }
    if (onProcess) onProcess();
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get what next tools
  let whatNextTools: any[] = [];
  if (toolId) {
    const currentTool = getToolById(toolId);
    if (currentTool && currentTool.relatedTools) {
      whatNextTools = currentTool.relatedTools
        .slice(0, 3)
        .map(id => getToolById(id))
        .filter(Boolean);
    }
  }

  let requiresBackend = false;
  if (toolId) {
    const t = getToolById(toolId);
    if (t) {
      requiresBackend = t.requiresBackend;
    }
  }

  // Track tool open
  React.useEffect(() => {
    if (toolId) {
      const tool = getToolById(toolId);
      if (tool) {
        trackEvent('tool_open', { tool_name: tool.name });
      }
    }
  }, [toolId]);

  // Track processing start
  const prevProcessing = React.useRef(processing);
  React.useEffect(() => {
    if (processing && !prevProcessing.current && toolId) {
      const tool = getToolById(toolId);
      if (tool) {
        trackEvent('tool_process_start', { tool_name: tool.name });
      }
    }
    prevProcessing.current = processing;
  }, [processing, toolId]);

  // Track processing success
  React.useEffect(() => {
    if (result && toolId) {
      const tool = getToolById(toolId);
      if (tool) {
        trackEvent('tool_process_success', {
          tool_name: tool.name,
          file_type: result.downloadFilename?.split('.').pop()?.toLowerCase() || 'unknown',
          processing_type: tool.requiresBackend ? 'server' : 'local'
        });
      }
    }
  }, [result, toolId]);

  // Track processing error
  React.useEffect(() => {
    if ((error || localPlanError) && toolId) {
      const tool = getToolById(toolId);
      if (tool) {
        trackEvent('tool_process_error', {
          tool_name: tool.name,
          error_message: error || localPlanError
        });
      }
    }
  }, [error, localPlanError, toolId]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
        <p className="text-muted-fg mb-4">{description}</p>
        
        {/* Privacy-First Tool Message Callout */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-fg bg-muted-bg/50 px-3 py-1 rounded-full border border-border-color">
            {requiresBackend ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                This file is processed on our server to complete the conversion.
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Your file is processed locally in your browser whenever supported.
              </>
            )}
          </span>
        </div>
        {toolId && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-muted-bg text-sm font-semibold flex items-center gap-2 border border-border-color/60">
              <span className="text-muted-fg">Plan: <strong className="text-foreground uppercase text-xs tracking-wider">{planName}</strong></span>
              <span className="text-border-color">|</span>
              <span className="text-primary-600 font-bold">
                {activePlan === 'premium' 
                  ? 'High fair-use limits' 
                  : `${Math.max(0, planLimits.dailyUses - getUsageCount())} uses remaining today`
                }
              </span>
            </div>

            {activePlan === 'free' && (
              <div className="mt-2 text-center max-w-md bg-primary-50/30 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground">Need more daily capacity?</p>
                  <p className="text-[11px] text-muted-fg mt-0.5">Premium gives you larger file sizes and unlimited daily uses*.</p>
                </div>
                <Link to="/pricing">
                  <Button variant="primary" size="sm" className="whitespace-nowrap text-xs py-1.5 px-4 h-auto">
                    View Premium
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {(error || localPlanError) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-between gap-3 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error || localPlanError}</p>
          </div>
          {localPlanError && (
            <Button variant="primary" size="sm" onClick={() => navigate('/pricing')}>
              View Plans
            </Button>
          )}
        </div>
      )}

      {/* Upload State */}
      {!processing && !result && hasNoChildren && (
        <div 
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px] ${
            dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]' : 'border-border-color bg-card hover:border-primary-400 hover:bg-muted-bg/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Upload file</h3>
          <p className="text-muted-fg mb-6">Drag and drop, or click to browse</p>
          <p className="text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
            Local processing
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={accept}
            multiple={multiple}
            onChange={(e) => {
              if (e.target.files) handleInterceptFileSelect(Array.from(e.target.files));
            }} 
          />
        </div>
      )}

      {/* Settings / Custom Content State */}
      {!processing && !result && !hasNoChildren && (
        <div className="bg-card border border-border-color rounded-2xl p-6 shadow-sm">
          {children}
          {onProcess && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onReset}>Cancel</Button>
              <Button variant="primary" onClick={handleInterceptProcess}>Process File</Button>
            </div>
          )}
        </div>
      )}

      {/* Processing State */}
      {processing && (
        <div className="border border-border-color rounded-3xl p-12 text-center bg-card flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-6" />
          <h3 className="text-xl font-bold text-foreground mb-2">Processing your file...</h3>
          {progress !== undefined && (
            <div className="w-full max-w-md mt-6">
              <div className="flex justify-between text-sm mb-2 text-muted-fg">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {!processing && result && (
        <div className="border border-green-200 dark:border-green-900/50 rounded-3xl p-12 text-center bg-card shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-4">Done!</h3>
          
          {result.message && <p className="text-lg text-foreground mb-6">{result.message}</p>}
          
          {resultNode && <div className="w-full mb-8">{resultNode}</div>}

          {(result.originalSize || result.newSize) && (
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {result.originalSize && (
                <div className="text-center">
                  <p className="text-sm text-muted-fg">Original</p>
                  <p className="text-xl font-semibold text-foreground">{formatSize(result.originalSize)}</p>
                </div>
              )}
              {result.newSize && (
                <div className="text-center">
                  <p className="text-sm text-muted-fg">New</p>
                  <p className="text-xl font-semibold text-primary-600">{formatSize(result.newSize)}</p>
                </div>
              )}
              {result.savedPercentage !== undefined && (
                <div className="text-center">
                  <p className="text-sm text-muted-fg">Saved</p>
                  <p className="text-xl font-bold text-green-500">{result.savedPercentage.toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-10">
            <Button variant="outline" className="flex-1" onClick={onReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Process Another
            </Button>
            {result.downloadUrl && (
              <a 
                href={result.downloadUrl} 
                download={result.downloadFilename || 'download'} 
                className="flex-1"
                onClick={() => {
                  if (toolId) {
                    const tool = getToolById(toolId);
                    trackEvent('file_download', {
                      tool_name: tool?.name || 'unknown',
                      file_type: result.downloadFilename?.split('.').pop()?.toLowerCase() || 'unknown'
                    });
                  }
                }}
              >
                <Button variant="primary" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </a>
            )}
          </div>
          
          {whatNextTools.length > 0 && (
            <div className="w-full pt-8 border-t border-border-color">
              <h4 className="text-sm font-semibold text-muted-fg mb-4 uppercase tracking-wider">What next?</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {whatNextTools.map(t => (
                  <Link key={t.id} to={t.route} className="px-4 py-2 bg-muted-bg/50 hover:bg-muted-bg rounded-full text-sm font-medium text-foreground transition-colors flex items-center group">
                    {t.name}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Premium Limit Overlay Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-background border border-border-color rounded-3xl max-w-md w-full p-8 shadow-2xl flex flex-col text-left space-y-6">
            {/* Close button */}
            <button 
              onClick={() => {
                setShowPremiumModal(false);
                setDismissedPremiumModalToday(true);
              }}
              className="absolute top-4 right-4 p-2 text-muted-fg hover:text-foreground rounded-full hover:bg-muted-bg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight leading-none">
                You've used all 5 free uses for today
              </h3>
              <p className="text-xs text-muted-fg leading-relaxed">
                You can continue using Calcora tomorrow, or upgrade to Premium for higher limits and more usage.
              </p>
            </div>

            {/* Product card for Premium */}
            <div className="p-5 bg-primary-50/40 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/40 rounded-2xl">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-lg font-black text-foreground">Premium Plan</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary-600">$4.99</span>
                  <span className="text-xs text-muted-fg font-semibold">/month</span>
                </div>
              </div>

              {/* Bullet checklist */}
              <ul className="space-y-2.5">
                {[
                  'Higher fair-use daily limits (500/day)',
                  'Larger files (Up to 1GB)',
                  'Larger batches',
                  'Longer videos',
                  'Advanced features',
                  'No ads',
                  'Priority support'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                    <Check className="w-4 h-4 text-primary-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                variant="primary" 
                className="w-full h-11 text-xs"
                onClick={() => {
                  setShowPremiumModal(false);
                  setDismissedPremiumModalToday(true);
                  navigate('/pricing');
                }}
              >
                Upgrade to Premium
              </Button>
              <button
                onClick={() => {
                  setShowPremiumModal(false);
                  setDismissedPremiumModalToday(true);
                }}
                className="w-full py-2.5 text-center text-xs text-muted-fg hover:text-foreground font-bold transition-colors cursor-pointer"
              >
                Continue Tomorrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
