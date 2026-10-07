import React, { useState, useEffect } from 'react';
import { ToolWrapper } from '../../components/tools/ToolWrapper';
import { getToolById } from '../../data/tools';
import { Calculator, ArrowRightLeft, Grid, Smartphone, Monitor } from 'lucide-react';

export const AspectRatioCalculator = () => {
  const tool = getToolById('aspect-ratio-calculator');

  // Input states
  const [w1, setW1] = useState<number>(1920);
  const [h1, setH1] = useState<number>(1080);
  const [simplified, setSimplified] = useState<string>('16 : 9');

  // Scaling calculator states
  const [ratioW, setRatioW] = useState<number>(16);
  const [ratioH, setRatioH] = useState<number>(9);
  const [w2, setW2] = useState<number>(1280);
  const [h2, setH2] = useState<number>(720);

  // Greatest common divisor helper
  const calculateGcd = (a: number, b: number): number => {
    return b === 0 ? a : calculateGcd(b, a % b);
  };

  // Update ratio from w1/h1
  useEffect(() => {
    if (w1 > 0 && h1 > 0) {
      const divisor = calculateGcd(w1, h1);
      const simpW = w1 / divisor;
      const simpH = h1 / divisor;
      setSimplified(`${simpW} : ${simpH}`);
    } else {
      setSimplified('N/A');
    }
  }, [w1, h1]);

  // Handler for changes in w2
  const handleW2Change = (val: number) => {
    setW2(val);
    if (ratioW > 0 && ratioH > 0) {
      setH2(Math.round((val * ratioH) / ratioW));
    }
  };

  // Handler for changes in h2
  const handleH2Change = (val: number) => {
    setH2(val);
    if (ratioW > 0 && ratioH > 0) {
      setW2(Math.round((val * ratioW) / ratioH));
    }
  };

  // Apply Ratio Presets to scaling section
  const applyPreset = (w: number, h: number) => {
    setRatioW(w);
    setRatioH(h);
    setH2(Math.round((w2 * h) / w));
  };

  if (!tool) return null;

  return (
    <ToolWrapper tool={tool}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{tool.name}</h1>
          <p className="text-muted-fg">{tool.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section 1: Simplify Ratio */}
          <div className="bg-card border border-border-color p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2 border-b border-border-color pb-3">
              <Grid className="w-5 h-5 text-primary-600" />
              Aspect Ratio Simplifier
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={w1}
                    onChange={(e) => setW1(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full p-3.5 rounded-xl border border-border-color bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={h1}
                    onChange={(e) => setH1(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full p-3.5 rounded-xl border border-border-color bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="bg-muted-bg/30 p-6 rounded-xl flex flex-col items-center justify-center text-center mt-6">
                <span className="text-xs uppercase font-bold text-muted-fg tracking-widest mb-1">Simplified Ratio</span>
                <span className="text-3xl font-black text-primary-600 tracking-tight">{simplified}</span>
                <span className="text-xs text-muted-fg/80 mt-2">({(w1 / h1).toFixed(3)} decimal aspect ratio)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Ratio Dimensional Scaler */}
          <div className="bg-card border border-border-color p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2 border-b border-border-color pb-3">
              <ArrowRightLeft className="w-5 h-5 text-primary-600" />
              Dimension Scaler
            </h3>

            {/* Presets */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-wider">Presets</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => applyPreset(16, 9)} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg font-semibold">16:9 HDTV</button>
                <button type="button" onClick={() => applyPreset(1, 1)} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg font-semibold">1:1 Square</button>
                <button type="button" onClick={() => applyPreset(4, 5)} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg font-semibold">4:5 Portrait</button>
                <button type="button" onClick={() => applyPreset(9, 16)} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg font-semibold">9:16 Vertical</button>
                <button type="button" onClick={() => applyPreset(21, 9)} className="px-3 py-1.5 rounded-lg border border-border-color text-xs bg-card hover:bg-muted-bg font-semibold">21:9 Ultrawide</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Ratio Width</label>
                <input
                  type="number"
                  value={ratioW}
                  onChange={(e) => {
                    const rw = Math.max(1, parseInt(e.target.value) || 1);
                    setRatioW(rw);
                    setH2(Math.round((w2 * ratioH) / rw));
                  }}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Ratio Height</label>
                <input
                  type="number"
                  value={ratioH}
                  onChange={(e) => {
                    const rh = Math.max(1, parseInt(e.target.value) || 1);
                    setRatioH(rh);
                    setH2(Math.round((w2 * rh) / ratioW));
                  }}
                  className="w-full p-3 rounded-xl border border-border-color bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="border-t border-border-color pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Output Width (px)</label>
                <input
                  type="number"
                  value={w2}
                  onChange={(e) => handleW2Change(parseInt(e.target.value) || 0)}
                  className="w-full p-3.5 rounded-xl border-2 border-primary-500/30 bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">Output Height (px)</label>
                <input
                  type="number"
                  value={h2}
                  onChange={(e) => handleH2Change(parseInt(e.target.value) || 0)}
                  className="w-full p-3.5 rounded-xl border-2 border-primary-500/30 bg-background text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};
