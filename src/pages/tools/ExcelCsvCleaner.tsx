import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { ToolLayout } from '../../components/tools/ToolLayout';
import { getToolById } from '../../data/tools';
import { 
  FileSpreadsheet, Trash2, Check, RefreshCw, AlertCircle, 
  FileText, Download, ListFilter, Sliders, Play, Columns, 
  ArrowRight, ArrowLeft, Undo, RotateCcw, Search, ChevronRight, 
  ChevronLeft, Plus, Split, Combine, ArrowUpDown, Shield, CreditCard, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/Button';
import { usePlanStore } from '../../store/usePlanStore';
import { getPlanLimits } from '../../config/pricing';

interface CleanStats {
  originalRows: number;
  previewRows: number;
  duplicatesRemoved: number;
  blankRowsRemoved: number;
  blankColsRemoved: number;
  trimmedCells: number;
  normalizedCells: number;
  malformedEmailsCount: number;
  otherModifications: number;
}

interface HistoryItem {
  headers: string[];
  rows: any[][];
  description: string;
}

export const ExcelCsvCleaner = () => {
  const tool = getToolById('excel-csv-cleaner');
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [step, setStep] = useState<'upload' | 'edit' | 'preview' | 'export'>('upload');

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<any | undefined>();

  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  const [originalRows, setOriginalRows] = useState<any[][]>([]);

  const [currentHeaders, setCurrentHeaders] = useState<string[]>([]);
  const [currentRows, setCurrentRows] = useState<any[][]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [dedupeEnabled, setDedupeEnabled] = useState(true);
  const [dedupeColumns, setDedupeColumns] = useState<string[]>([]);
  const [dedupeIgnoreCase, setDedupeIgnoreCase] = useState(true);
  const [dedupeTrim, setDedupeTrim] = useState(true);
  const [dedupeIgnoreBlank, setDedupeIgnoreBlank] = useState(true);

  const [removeBlankRows, setRemoveBlankRows] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [normalizeText, setNormalizeText] = useState<'none' | 'lowercase' | 'uppercase' | 'titlecase'>('none');

  const [emailCleanup, setEmailCleanup] = useState(false);
  const [phoneCleanup, setPhoneCleanup] = useState(false);
  const [phoneSep, setPhoneSep] = useState<'none' | 'hyphen' | 'space'>('none');

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findCol, setFindCol] = useState<string>('all');

  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [mergeCol1, setMergeCol1] = useState('');
  const [mergeCol2, setMergeCol2] = useState('');
  const [mergeDestName, setMergeDestName] = useState('Merged_Column');
  const [mergeSep, setMergeSep] = useState<'space' | 'comma' | 'dash' | 'custom'>('space');
  const [mergeCustomSep, setMergeCustomSep] = useState('');

  const [splitCol, setSplitCol] = useState('');
  const [splitSep, setSplitSep] = useState<'space' | 'comma' | 'dash' | 'tab'>('comma');

  const [stats, setStats] = useState<CleanStats | null>(null);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: any[][] } | null>(null);

  const [previewPage, setPreviewPage] = useState(0);
  const pageSize = 8;

  const pushHistory = (description: string, nextHeaders = currentHeaders, nextRows = currentRows) => {
    setHistory(prev => [...prev, {
      headers: [...currentHeaders],
      rows: currentRows.map(r => [...r]),
      description
    }]);
    setCurrentHeaders(nextHeaders);
    setCurrentRows(nextRows);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastItem = history[history.length - 1];
    setCurrentHeaders(lastItem.headers);
    setCurrentRows(lastItem.rows);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!['xlsx', 'xls', 'csv', 'tsv'].includes(extension || '')) {
      setError('Please select a valid spreadsheet file (.xlsx, .xls, .csv, .tsv).');
      return;
    }

    const limits = getPlanLimits(usePlanStore.getState().activePlan);
    const maxBytes = limits.maxFileSize * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setError(`This file exceeds the ${limits.maxFileSize}MB limit for your plan. Please upgrade to Premium or use a smaller file.`);
      return;
    }

    setFile(selectedFile);
    setError(undefined);
    setResult(undefined);
    setStats(null);
    setPreviewData(null);
    setHistory([]);
    setProcessing(true);
    setProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            setError('The selected spreadsheet does not contain any worksheets.');
            setProcessing(false);
            return;
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          if (rawData.length === 0) {
            setError('This sheet appears to be completely empty.');
            setProcessing(false);
            return;
          }

          const parsedHeaders = (rawData[0] || []).map((h: any, idx: number) => h ? String(h).trim() : `Column_${idx + 1}`);
          const parsedRows = rawData.slice(1);

          setOriginalHeaders(parsedHeaders);
          setOriginalRows(parsedRows);

          setCurrentHeaders(parsedHeaders);
          setCurrentRows(parsedRows);

          setDedupeColumns([]);
          setStep('edit');
          setProcessing(false);
          setProgress(100);
        } catch (err) {
          console.error(err);
          setError('Failed to parse spreadsheet. Verify it is not corrupted or password protected.');
          setProcessing(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file contents.');
        setProcessing(false);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during import.');
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setOriginalHeaders([]);
    setOriginalRows([]);
    setCurrentHeaders([]);
    setCurrentRows([]);
    setHistory([]);
    setStats(null);
    setPreviewData(null);
    setResult(undefined);
    setError(undefined);
    setProgress(0);
    setStep('upload');
  };

  const handleResetToOriginal = () => {
    if (window.confirm('Are you sure you want to revert all custom edits and configurations?')) {
      setCurrentHeaders([...originalHeaders]);
      setCurrentRows(originalRows.map(r => [...r]));
      setHistory([]);
    }
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const applyFindAndReplace = () => {
    if (!findText) return;
    const desc = `Find & Replace: "${findText}" with "${replaceText}"`;
    let modifiedCount = 0;

    const nextRows = currentRows.map(row => {
      return row.map((cell, colIdx) => {
        const headerName = currentHeaders[colIdx];
        if (findCol !== 'all' && headerName !== findCol) {
          return cell;
        }
        if (cell !== null && cell !== undefined) {
          const strVal = String(cell);
          if (strVal.includes(findText)) {
            modifiedCount++;
            return strVal.replaceAll(findText, replaceText);
          }
        }
        return cell;
      });
    });

    pushHistory(desc, currentHeaders, nextRows);
    setFindText('');
    alert(`Successfully replaced matching values. Total corrections: ${modifiedCount}`);
  };

  const applySort = () => {
    if (!sortCol) return;
    const colIdx = currentHeaders.indexOf(sortCol);
    if (colIdx === -1) return;

    const desc = `Sort rows by column: "${sortCol}" (${sortDir})`;
    const sorted = [...currentRows].sort((a, b) => {
      const valA = a[colIdx] === undefined || a[colIdx] === null ? '' : String(a[colIdx]).toLowerCase();
      const valB = b[colIdx] === undefined || b[colIdx] === null ? '' : String(b[colIdx]).toLowerCase();
      
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    pushHistory(desc, currentHeaders, sorted);
  };

  const applyColumnRename = (idx: number, newName: string) => {
    if (!newName.trim()) return;
    const desc = `Rename column "${currentHeaders[idx]}" to "${newName.trim()}"`;
    const nextHeaders = [...currentHeaders];
    nextHeaders[idx] = newName.trim();
    pushHistory(desc, nextHeaders, currentRows);
  };

  const applyRemoveColumn = (colName: string) => {
    const colIdx = currentHeaders.indexOf(colName);
    if (colIdx === -1) return;

    const desc = `Remove column: "${colName}"`;
    const nextHeaders = currentHeaders.filter((_, idx) => idx !== colIdx);
    const nextRows = currentRows.map(row => row.filter((_, idx) => idx !== colIdx));
    pushHistory(desc, nextHeaders, nextRows);
  };

  const applyMoveColumn = (colName: string, direction: 'left' | 'right') => {
    const idx = currentHeaders.indexOf(colName);
    if (idx === -1) return;
    if (direction === 'left' && idx === 0) return;
    if (direction === 'right' && idx === currentHeaders.length - 1) return;

    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    const desc = `Move column "${colName}" ${direction}`;

    const nextHeaders = [...currentHeaders];
    const tempHeader = nextHeaders[idx];
    nextHeaders[idx] = nextHeaders[swapIdx];
    nextHeaders[swapIdx] = tempHeader;

    const nextRows = currentRows.map(row => {
      const copy = [...row];
      const tempCell = copy[idx];
      copy[idx] = copy[swapIdx];
      copy[swapIdx] = tempCell;
      return copy;
    });

    pushHistory(desc, nextHeaders, nextRows);
  };

  const applyMergeColumns = () => {
    if (!mergeCol1 || !mergeCol2 || !mergeDestName.trim()) return;
    const idx1 = currentHeaders.indexOf(mergeCol1);
    const idx2 = currentHeaders.indexOf(mergeCol2);
    if (idx1 === -1 || idx2 === -1) return;

    const desc = `Merge "${mergeCol1}" and "${mergeCol2}" into "${mergeDestName}"`;
    
    const nextHeaders = [...currentHeaders, mergeDestName];
    
    const separator = mergeSep === 'space' ? ' ' 
                    : mergeSep === 'comma' ? ', ' 
                    : mergeSep === 'dash' ? ' - ' 
                    : mergeCustomSep;

    const nextRows = currentRows.map(row => {
      const val1 = row[idx1] !== null && row[idx1] !== undefined ? String(row[idx1]) : '';
      const val2 = row[idx2] !== null && row[idx2] !== undefined ? String(row[idx2]) : '';
      const mergedVal = (val1 && val2) ? `${val1}${separator}${val2}` : (val1 || val2);
      return [...row, mergedVal];
    });

    pushHistory(desc, nextHeaders, nextRows);
    setMergeCol1('');
    setMergeCol2('');
    alert(`Columns successfully merged as "${mergeDestName}"`);
  };

  const applySplitColumn = () => {
    if (!splitCol) return;
    const colIdx = currentHeaders.indexOf(splitCol);
    if (colIdx === -1) return;

    const desc = `Split column "${splitCol}"`;
    const separator = splitSep === 'space' ? ' ' 
                    : splitSep === 'comma' ? ',' 
                    : splitSep === 'dash' ? '-' 
                    : '\t';

    const header1 = `${splitCol}_1`;
    const header2 = `${splitCol}_2`;

    const nextHeaders = [...currentHeaders];
    nextHeaders.splice(colIdx, 1, header1, header2);

    const nextRows = currentRows.map(row => {
      const copy = [...row];
      const cellVal = copy[colIdx] !== null && copy[colIdx] !== undefined ? String(copy[colIdx]) : '';
      
      const parts = cellVal.split(separator);
      const part1 = parts[0] || '';
      const part2 = parts.slice(1).join(separator) || '';

      copy.splice(colIdx, 1, part1, part2);
      return copy;
    });

    pushHistory(desc, nextHeaders, nextRows);
    setSplitCol('');
    alert(`Successfully split "${splitCol}" into two new columns`);
  };

  const toggleDedupeColumn = (col: string) => {
    setDedupeColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handlePreviewChanges = async () => {
    setProcessing(true);
    setProgress(20);

    try {
      let duplicateCount = 0;
      let blankRowCount = 0;
      let trimmedCellCount = 0;
      let normalizedCellCount = 0;
      let malformedEmailCount = 0;

      let workingRows = currentRows.map(r => [...r]);
      const activeHeaders = [...currentHeaders];

      workingRows = workingRows.map(row => {
        const cleanedRow = [...row];
        activeHeaders.forEach((_, colIdx) => {
          let val = cleanedRow[colIdx];
          if (val !== undefined && val !== null) {
            if (trimWhitespace && typeof val === 'string' && val !== val.trim()) {
              val = val.trim();
              trimmedCellCount++;
            }

            if (normalizeText !== 'none' && typeof val === 'string') {
              const beforeNorm = val;
              if (normalizeText === 'lowercase') val = val.toLowerCase();
              else if (normalizeText === 'uppercase') val = val.toUpperCase();
              else if (normalizeText === 'titlecase') val = toTitleCase(val);
              
              if (val !== beforeNorm) {
                normalizedCellCount++;
              }
            }

            if (emailCleanup && typeof val === 'string') {
              const emailStr = val.trim();
              if (emailStr.includes('@') || emailStr.endsWith('.com') || emailStr.endsWith('.org')) {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
                if (!isValid) {
                  malformedEmailCount++;
                }
              }
            }

            if (phoneCleanup && (typeof val === 'string' || typeof val === 'number')) {
              let phoneStr = String(val).trim();
              const digitsOnly = phoneStr.replace(/\D/g, '');
              if (digitsOnly.length >= 7) {
                if (phoneSep === 'hyphen') {
                  if (digitsOnly.length === 10) {
                    val = `${digitsOnly.slice(0,3)}-${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
                  }
                } else if (phoneSep === 'space') {
                  if (digitsOnly.length === 10) {
                    val = `${digitsOnly.slice(0,3)} ${digitsOnly.slice(3,6)} ${digitsOnly.slice(6)}`;
                  }
                } else {
                  val = digitsOnly;
                }
              }
            }

            cleanedRow[colIdx] = val;
          }
        });
        return cleanedRow;
      });

      setProgress(50);

      if (removeBlankRows) {
        const beforeLen = workingRows.length;
        workingRows = workingRows.filter(row => {
          const isBlank = row.every(v => v === undefined || v === null || String(v).trim() === '');
          return !isBlank;
        });
        blankRowCount = beforeLen - workingRows.length;
      }

      if (dedupeEnabled) {
        const seen = new Set<string>();
        const uniqueRows: any[][] = [];
        
        workingRows.forEach(row => {
          let signatureElements: string[] = [];
          
          if (dedupeColumns.length > 0) {
            dedupeColumns.forEach(colName => {
              const colIdx = activeHeaders.indexOf(colName);
              if (colIdx !== -1) {
                let cellVal = row[colIdx];
                if (dedupeTrim && typeof cellVal === 'string') cellVal = cellVal.trim();
                if (dedupeIgnoreCase && typeof cellVal === 'string') cellVal = cellVal.toLowerCase();
                signatureElements.push(cellVal !== undefined && cellVal !== null ? String(cellVal) : '');
              }
            });
          } else {
            activeHeaders.forEach((_, colIdx) => {
              let cellVal = row[colIdx];
              if (dedupeTrim && typeof cellVal === 'string') cellVal = cellVal.trim();
              if (dedupeIgnoreCase && typeof cellVal === 'string') cellVal = cellVal.toLowerCase();
              signatureElements.push(cellVal !== undefined && cellVal !== null ? String(cellVal) : '');
            });
          }

          const signature = signatureElements.join('|||');
          const isFullyBlankSignature = signatureElements.every(s => s === '');
          
          if (dedupeIgnoreBlank && isFullyBlankSignature) {
            uniqueRows.push(row);
          } else if (!seen.has(signature)) {
            seen.add(signature);
            uniqueRows.push(row);
          } else {
            duplicateCount++;
          }
        });

        workingRows = uniqueRows;
      }

      setProgress(80);

      const otherCount = history.length;

      const exportStats: CleanStats = {
        originalRows: originalRows.length,
        previewRows: workingRows.length,
        duplicatesRemoved: duplicateCount,
        blankRowsRemoved: blankRowCount,
        blankColsRemoved: 0,
        trimmedCells: trimmedCellCount,
        normalizedCells: normalizedCellCount,
        malformedEmailsCount: malformedEmailCount,
        otherModifications: otherCount
      };

      setStats(exportStats);
      setPreviewData({ headers: activeHeaders, rows: workingRows });
      setStep('preview');
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('An error occurred during text auditing/cleaning validation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyExport = async () => {
    if (!previewData || !file) return;

    const canUse = usePlanStore.getState().canUseTool('excel-csv-cleaner');
    if (!canUse) {
      setShowUpgradeModal(true);
      return;
    }

    setProcessing(true);
    setProgress(30);

    try {
      const newSheet = XLSX.utils.aoa_to_sheet([previewData.headers, ...previewData.rows]);
      const newBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newBook, newSheet, "Cleaned_Data");

      setProgress(60);

      const outWb = XLSX.write(newBook, { bookType: 'xlsx', type: 'binary' });
      const outBuf = new ArrayBuffer(outWb.length);
      const outView = new Uint8Array(outBuf);
      for (let i = 0; i < outWb.length; i++) {
        outView[i] = outWb.charCodeAt(i) & 0xFF;
      }
      
      const xlsxBlob = new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const xlsxUrl = URL.createObjectURL(xlsxBlob);

      const csvContent = XLSX.utils.sheet_to_csv(newSheet);
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);

      const baseName = file.name.split('.').slice(0, -1).join('.');

      setResult({
        downloadUrl: xlsxUrl,
        downloadFilename: `${baseName}_cleaned.xlsx`,
        csvDownloadUrl: csvUrl,
        csvDownloadFilename: `${baseName}_cleaned.csv`,
        originalSize: file.size,
        newSize: xlsxBlob.size
      });

      usePlanStore.getState().consumeUsage('excel-csv-cleaner');

      setStep('export');
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('Failed to build export binary. Verify sheet row tokens.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolWrapper tool={tool}>
      <ToolLayout
        toolId={tool?.id}
        title={tool?.name || 'Excel / CSV Cleaner'}
        description={tool?.description || ''}
        accept=".xlsx, .xls, .csv, .tsv"
        onFileSelect={handleFileSelect}
        processing={processing}
        progress={progress}
        result={result}
        error={error}
        onReset={handleReset}
        onProcess={undefined}
      >
        {file && (
          <div className="w-full max-w-2xl mx-auto mb-8 bg-card border border-border-color p-4 rounded-2xl flex items-center justify-between shadow-sm">
            {[
              { id: 'edit', label: '1. Configure & Edit' },
              { id: 'preview', label: '2. Review Preview' },
              { id: 'export', label: '3. Complete Export' }
            ].map((s) => {
              const active = step === s.id;
              const completed = (s.id === 'edit' && step !== 'edit') || (s.id === 'preview' && step === 'export');
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    active ? 'bg-primary text-primary-foreground scale-110 shadow-sm' : completed ? 'bg-green-500 text-white' : 'bg-muted-bg text-muted-fg'
                  }`}>
                    {completed ? '✓' : s.id === 'edit' ? '1' : s.id === 'preview' ? '2' : '3'}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-foreground font-black' : 'text-muted-fg'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {step === 'edit' && file && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="bg-muted-bg/30 p-4 rounded-xl border border-border-color flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm truncate max-w-md">{file.name}</h4>
                  <p className="text-xs text-muted-fg mt-0.5">
                    Original dimensions: {originalRows.length} rows, {originalHeaders.length} columns.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndo} 
                  disabled={history.length === 0}
                  className="text-xs font-semibold flex items-center gap-1.5 h-8 py-0 px-3 cursor-pointer"
                >
                  <Undo className="w-3.5 h-3.5" />
                  Undo ({history.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetToOriginal}
                  className="text-xs font-semibold flex items-center gap-1.5 h-8 py-0 px-3 hover:text-red-600 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Revert
                </Button>
                <button 
                  onClick={handleReset}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer pl-2"
                >
                  Change File
                </button>
              </div>
            </div>

            {history.length > 0 && (
              <div className="text-xs bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 p-2.5 rounded-xl text-primary-700 font-medium">
                Last Action: {history[history.length - 1].description}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-sm font-bold text-muted-fg uppercase tracking-wider border-b border-border-color pb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Cleaning Operations
                </h3>

                <div className="bg-card p-5 rounded-2xl border border-border-color space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground text-sm flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={dedupeEnabled} 
                        onChange={(e) => setDedupeEnabled(e.target.checked)}
                        className="rounded accent-primary-600"
                      />
                      Remove Duplicate Rows
                    </label>
                    <span className="text-[10px] text-muted-fg font-bold bg-muted-bg px-2 py-0.5 rounded-full uppercase">Deduplication</span>
                  </div>

                  {dedupeEnabled && (
                    <div className="pl-6 space-y-3 pt-2 border-l-2 border-primary/20">
                      <p className="text-xs text-muted-fg">
                        Check duplicates using selective columns. If empty, checks the entire row:
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pb-1">
                        {currentHeaders.map(col => (
                          <button
                            key={col}
                            onClick={() => toggleDedupeColumn(col)}
                            className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors border ${
                              dedupeColumns.includes(col)
                                ? 'bg-primary-50 border-primary text-primary-700 font-bold'
                                : 'bg-muted-bg/30 border-border-color text-muted-fg hover:text-foreground'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                        <label className="text-xs text-muted-fg flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={dedupeIgnoreCase} 
                            onChange={(e) => setDedupeIgnoreCase(e.target.checked)}
                            className="rounded accent-primary-600"
                          />
                          Ignore Case
                        </label>
                        <label className="text-xs text-muted-fg flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={dedupeTrim} 
                            onChange={(e) => setDedupeTrim(e.target.checked)}
                            className="rounded accent-primary-600"
                          />
                          Trim spaces
                        </label>
                        <label className="text-xs text-muted-fg flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={dedupeIgnoreBlank} 
                            onChange={(e) => setDedupeIgnoreBlank(e.target.checked)}
                            className="rounded accent-primary-600"
                          />
                          Skip blanks
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card p-5 rounded-2xl border border-border-color space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-muted-fg uppercase">Spaces & Rows</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 text-xs text-foreground font-semibold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={removeBlankRows} 
                          onChange={(e) => setRemoveBlankRows(e.target.checked)}
                          className="rounded accent-primary-600"
                        />
                        Remove fully blank rows
                      </label>
                      <label className="flex items-center gap-3 text-xs text-foreground font-semibold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={trimWhitespace} 
                          onChange={(e) => setTrimWhitespace(e.target.checked)}
                          className="rounded accent-primary-600"
                        />
                        Trim leading/trailing cells
                      </label>
                    </div>
                  </div>

                  <div className="bg-card p-5 rounded-2xl border border-border-color space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-muted-fg uppercase">Standardize Case</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(['none', 'lowercase', 'uppercase', 'titlecase'] as const).map(option => (
                        <button
                          key={option}
                          onClick={() => setNormalizeText(option)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            normalizeText === option
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-muted-bg/30 border-border-color text-muted-fg hover:bg-muted-bg/50'
                          }`}
                        >
                          {option === 'none' && 'No Change'}
                          {option === 'lowercase' && 'lowercase'}
                          {option === 'uppercase' && 'UPPERCASE'}
                          {option === 'titlecase' && 'Title Case'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-2xl border border-border-color space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    Interactive Find & Replace
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-fg">In Column</label>
                      <select 
                        value={findCol} 
                        onChange={(e) => setFindCol(e.target.value)}
                        className="w-full bg-card px-2 py-1.5 rounded-lg border border-border-color text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="all">All Columns</option>
                        {currentHeaders.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-fg">Find Text</label>
                      <input 
                        type="text" 
                        value={findText} 
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="e.g. N/A"
                        className="w-full bg-card px-2 py-1.5 rounded-lg border border-border-color text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-fg">Replace With</label>
                      <input 
                        type="text" 
                        value={replaceText} 
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="e.g. Unknown"
                        className="w-full bg-card px-2 py-1.5 rounded-lg border border-border-color text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={applyFindAndReplace}
                    disabled={!findText}
                    className="w-full text-xs font-bold"
                  >
                    Replace All Matches
                  </Button>
                </div>

                <div className="bg-card p-5 rounded-2xl border border-border-color space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                    Sort Rows by Column
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <select
                        value={sortCol}
                        onChange={(e) => setSortCol(e.target.value)}
                        className="w-full bg-card px-2 py-1.5 rounded-lg border border-border-color text-xs focus:outline-none"
                      >
                        <option value="">-- Choose Column --</option>
                        {currentHeaders.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSortDir('asc')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${sortDir === 'asc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted-bg/30 text-muted-fg border-border-color'}`}
                      >
                        Ascending
                      </button>
                      <button
                        onClick={() => setSortDir('desc')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${sortDir === 'desc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted-bg/30 text-muted-fg border-border-color'}`}
                      >
                        Descending
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applySort}
                      disabled={!sortCol}
                      className="text-xs font-bold"
                    >
                      Sort Table
                    </Button>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-2xl border border-border-color space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase">Audits & Normalization</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-start gap-2.5 text-xs text-foreground font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailCleanup} 
                        onChange={(e) => setEmailCleanup(e.target.checked)}
                        className="rounded accent-primary-600 mt-0.5"
                      />
                      <div>
                        <span>Audit Malformed Emails</span>
                        <p className="text-[10px] text-muted-fg font-normal mt-0.5">Detects cells missing "@" domain structures.</p>
                      </div>
                    </label>

                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 text-xs text-foreground font-semibold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={phoneCleanup} 
                          onChange={(e) => setPhoneCleanup(e.target.checked)}
                          className="rounded accent-primary-600 mt-0.5"
                        />
                        <div>
                          <span>Format Phone Numbers</span>
                          <p className="text-[10px] text-muted-fg font-normal mt-0.5">Cleans and normalizes digit spacing.</p>
                        </div>
                      </label>

                      {phoneCleanup && (
                        <div className="pl-6 flex flex-wrap gap-1.5">
                          {(['none', 'hyphen', 'space'] as const).map(sep => (
                            <button
                              key={sep}
                              onClick={() => setPhoneSep(sep)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${phoneSep === sep ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted-bg/40 text-muted-fg'}`}
                            >
                              {sep === 'none' && 'Digits'}
                              {sep === 'hyphen' && '123-456'}
                              {sep === 'space' && '123 456'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <h3 className="text-sm font-bold text-muted-fg uppercase tracking-wider border-b border-border-color pb-2 flex items-center gap-2">
                  <Columns className="w-4 h-4 text-primary" />
                  Structure Editor
                </h3>

                <div className="bg-card border border-border-color rounded-2xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase flex items-center gap-1.5">
                    <Combine className="w-4 h-4 text-primary" />
                    Merge Two Columns
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-fg">Column A</label>
                      <select 
                        value={mergeCol1} 
                        onChange={(e) => setMergeCol1(e.target.value)}
                        className="w-full bg-card p-1.5 border border-border-color rounded-lg text-xs"
                      >
                        <option value="">-- Choose --</option>
                        {currentHeaders.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-fg">Column B</label>
                      <select 
                        value={mergeCol2} 
                        onChange={(e) => setMergeCol2(e.target.value)}
                        className="w-full bg-card p-1.5 border border-border-color rounded-lg text-xs"
                      >
                        <option value="">-- Choose --</option>
                        {currentHeaders.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-fg">Merged Column Header Name</label>
                    <input 
                      type="text" 
                      value={mergeDestName} 
                      onChange={(e) => setMergeDestName(e.target.value)}
                      placeholder="Merged_Column"
                      className="w-full bg-card px-2 py-1 border border-border-color rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-fg block">Join Separator</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'space', label: 'Space' },
                        { id: 'comma', label: 'Comma' },
                        { id: 'dash', label: 'Dash' },
                        { id: 'custom', label: 'Custom' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => setMergeSep(s.id as any)}
                          className={`py-1 rounded border text-[9px] font-bold ${mergeSep === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted-bg/30 text-muted-fg'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {mergeSep === 'custom' && (
                      <input 
                        type="text" 
                        placeholder="Separator char" 
                        value={mergeCustomSep} 
                        onChange={(e) => setMergeCustomSep(e.target.value)}
                        className="w-full bg-card px-2 py-1 border border-border-color rounded-lg text-xs mt-1"
                      />
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={applyMergeColumns}
                    disabled={!mergeCol1 || !mergeCol2 || !mergeDestName}
                    className="w-full text-xs font-bold"
                  >
                    Execute Merge
                  </Button>
                </div>

                <div className="bg-card border border-border-color rounded-2xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-muted-fg uppercase flex items-center gap-1.5">
                    <Split className="w-4 h-4 text-primary" />
                    Split a Column
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-fg">Column to Split</label>
                      <select 
                        value={splitCol} 
                        onChange={(e) => setSplitCol(e.target.value)}
                        className="w-full bg-card p-1.5 border border-border-color rounded-lg text-xs"
                      >
                        <option value="">-- Choose --</option>
                        {currentHeaders.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-fg">Split Separator</label>
                      <select 
                        value={splitSep} 
                        onChange={(e) => setSplitSep(e.target.value as any)}
                        className="w-full bg-card p-1.5 border border-border-color rounded-lg text-xs"
                      >
                        <option value="space">Space</option>
                        <option value="comma">Comma (,)</option>
                        <option value="dash">Dash (-)</option>
                        <option value="tab">Tab</option>
                      </select>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={applySplitColumn}
                    disabled={!splitCol}
                    className="w-full text-xs font-bold"
                  >
                    Execute Split
                  </Button>
                </div>

                <div className="bg-card border border-border-color rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-muted-fg uppercase">Rename & Reorder Columns</h4>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {currentHeaders.map((col, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-muted-bg/10 border border-border-color/60 flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <input 
                            type="text" 
                            value={col} 
                            onChange={(e) => applyColumnRename(idx, e.target.value)}
                            placeholder="Column Name"
                            className="w-full bg-card px-2 py-1 rounded border border-border-color font-semibold text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => applyMoveColumn(col, 'left')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-muted-bg text-muted-fg hover:text-foreground disabled:opacity-30 cursor-pointer"
                            title="Move column left"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => applyMoveColumn(col, 'right')}
                            disabled={idx === currentHeaders.length - 1}
                            className="p-1 rounded hover:bg-muted-bg text-muted-fg hover:text-foreground disabled:opacity-30 cursor-pointer"
                            title="Move column right"
                          >
                            →
                          </button>
                          <button
                            onClick={() => applyRemoveColumn(col)}
                            className="p-1 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                            title="Remove column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border-color flex justify-end">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handlePreviewChanges}
                className="font-black text-xs h-12 px-8 flex items-center gap-2"
              >
                Preview Changes
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && previewData && stats && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="bg-muted-bg/20 border border-border-color p-4 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground text-sm">Review Cleaned Preview</h4>
                <p className="text-xs text-muted-fg mt-0.5">Visually compare changes before committing to export.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStep('edit')}
                className="text-xs font-bold flex items-center gap-1 h-8 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Edit
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border-color p-4 rounded-2xl">
                <span className="text-[10px] text-muted-fg font-bold uppercase tracking-wider">Before</span>
                <p className="text-xl font-black text-foreground mt-1">{stats.originalRows} rows</p>
              </div>
              <div className="bg-card border border-primary/20 p-4 rounded-2xl bg-primary-50/10">
                <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">After Preview</span>
                <p className="text-xl font-black text-primary-600 mt-1">{stats.previewRows} rows</p>
              </div>
              <div className="bg-card border border-border-color p-4 rounded-2xl">
                <span className="text-[10px] text-muted-fg font-bold uppercase tracking-wider">Dedupe removed</span>
                <p className="text-xl font-black text-green-600 mt-1">-{stats.duplicatesRemoved}</p>
              </div>
              <div className="bg-card border border-border-color p-4 rounded-2xl">
                <span className="text-[10px] text-muted-fg font-bold uppercase tracking-wider">Empty lines pruned</span>
                <p className="text-xl font-black text-green-600 mt-1">-{stats.blankRowsRemoved}</p>
              </div>
            </div>

            <div className="bg-card border border-border-color p-5 rounded-2xl space-y-3">
              <h5 className="font-bold text-sm text-foreground">Scrubbing Event Log</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-muted-bg/30 rounded-xl border border-border-color/40 flex justify-between">
                  <span className="text-muted-fg">Whitespace trimmed:</span>
                  <span className="font-bold text-foreground">{stats.trimmedCells} cells</span>
                </div>
                <div className="p-3 bg-muted-bg/30 rounded-xl border border-border-color/40 flex justify-between">
                  <span className="text-muted-fg">Case modifications:</span>
                  <span className="font-bold text-foreground">{stats.normalizedCells} cells</span>
                </div>
                <div className="p-3 bg-muted-bg/30 rounded-xl border border-border-color/40 flex justify-between">
                  <span className="text-muted-fg">Email formatting alerts:</span>
                  <span className={`font-bold ${stats.malformedEmailsCount > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                    {stats.malformedEmailsCount} flagged
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border-color rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-muted-bg/20 border-b border-border-color flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Live Table Preview (Showing {previewPage * pageSize + 1} to {Math.min(previewData.rows.length, (previewPage + 1) * pageSize)} of {previewData.rows.length})</span>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={previewPage === 0} 
                    onClick={() => setPreviewPage(p => p - 1)}
                    className="p-1 px-2.5 rounded border border-border-color bg-card text-xs hover:bg-muted-bg disabled:opacity-30 cursor-pointer"
                  >
                    ← Prev
                  </button>
                  <button 
                    disabled={(previewPage + 1) * pageSize >= previewData.rows.length} 
                    onClick={() => setPreviewPage(p => p + 1)}
                    className="p-1 px-2.5 rounded border border-border-color bg-card text-xs hover:bg-muted-bg disabled:opacity-30 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-color bg-muted-bg/40 font-bold text-foreground uppercase">
                      {previewData.headers.map((h, i) => (
                        <th key={i} className="p-3 min-w-[120px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/50">
                    {previewData.rows.slice(previewPage * pageSize, (previewPage + 1) * pageSize).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-muted-bg/10">
                        {previewData.headers.map((_, cIdx) => {
                          const cellVal = row[cIdx];
                          return (
                            <td key={cIdx} className="p-3 text-muted-fg font-medium break-words">
                              {cellVal !== undefined && cellVal !== null ? String(cellVal) : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {previewData.rows.length === 0 && (
                      <tr>
                        <td colSpan={previewData.headers.length} className="p-8 text-center text-muted-fg font-medium">
                          No rows remain after applying the current operations. Go back and modify configurations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-8 border-t border-border-color flex justify-between items-center">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setStep('edit')}
                className="text-xs font-bold"
              >
                Modify Operations
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleApplyExport}
                className="font-black text-xs h-12 px-8 flex items-center gap-2"
              >
                Apply & Export Table
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'export' && result && (
          <div className="w-full max-w-2xl mx-auto space-y-6 text-center animate-fade-in py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-black text-foreground tracking-tight">Spreadsheet Export Complete!</h4>
              <p className="text-xs text-muted-fg leading-relaxed max-w-md mx-auto">
                The cleaned sheet was generated in standard XLSX and CSV formats. No database rows were uploaded or persisted online.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-4">
              <a href={result.downloadUrl} download={result.downloadFilename} className="flex-1">
                <Button variant="primary" className="w-full h-12 text-xs font-bold">
                  <Download className="w-4 h-4 mr-2" />
                  Download Cleaned XLSX
                </Button>
              </a>
              <a href={result.csvDownloadUrl} download={result.csvDownloadFilename} className="flex-1">
                <Button variant="outline" className="w-full h-12 text-xs font-bold hover:bg-muted-bg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Cleaned CSV
                </Button>
              </a>
            </div>

            <div className="pt-6 border-t border-border-color/60 max-w-md mx-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="text-xs font-semibold"
              >
                Clean Another Spreadsheet
              </Button>
            </div>
          </div>
        )}
      </ToolLayout>

      <section className="container mx-auto max-w-4xl px-4 py-16 space-y-12 text-left">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Simplify Spreadsheet Data Cleaning</h2>
          <p className="text-muted-fg mt-2 leading-relaxed">
            The Calcora Excel / CSV Cleaner helps you instantly deduplicate, scrub empty fields, normalize column names, and format contact fields locally in your browser. All operations are sandboxed in client memory, keeping sensitive databases secure and private.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3 text-primary">Supported Formats</h3>
            <ul className="space-y-2 text-xs text-muted-fg">
              <li><strong>.xlsx</strong> – Standard Excel Workbooks</li>
              <li><strong>.xls</strong> – Excel Legacy Spreadsheets</li>
              <li><strong>.csv</strong> – Comma-Separated Values</li>
              <li><strong>.tsv</strong> – Tab-Separated Values</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3 text-primary">Key Operations</h3>
            <ul className="space-y-2 text-xs text-muted-fg">
              <li>• Selective or whole-row duplicate identification</li>
              <li>• Intelligent blank row pruning</li>
              <li>• Text capitalization standardizations (Title Case, lower, UPPER)</li>
              <li>• Non-destructive malformed contact auditing</li>
            </ul>
          </div>
        </div>
      </section>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-color rounded-3xl p-6 max-w-md w-full shadow-lg space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-extrabold text-foreground font-display">Daily Free Limit Reached</h3>
                <p className="text-xs text-muted-fg mt-1">
                  You have consumed your 5 free daily uses across the Calcora tool suite.
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted-bg/50 rounded-xl border border-border-color text-xs text-left space-y-2">
              <p className="text-foreground font-semibold">Unlock Higher Fair-Use Limits</p>
              <p className="text-muted-fg">
                Get up to 500 actions/day, larger spreadsheet support, unlimited batch sizes for product photos, and high-res vertical social video exports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/pricing');
                }}
                className="flex-1 py-2.5 px-4 text-xs font-bold bg-primary hover:bg-primary-600 text-white rounded-xl transition-all cursor-pointer"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="py-2.5 px-4 text-xs font-bold bg-secondary border border-border-color text-foreground rounded-xl hover:bg-muted-bg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolWrapper>
  );
};