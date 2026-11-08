import React, { useRef, useEffect, useState } from 'react';
import { EQPreset } from '../types/audio';
import { EQ_FREQUENCIES, PREBUILT_EQ_PRESETS, audioEngine } from '../services/audioEngine';
import { Sliders, Save, Trash2, RotateCcw, Sparkles, Check, BookmarkPlus, Zap } from 'lucide-react';

interface EqualizerPanelProps {
  currentPreset: EQPreset;
  onSelectPreset: (preset: EQPreset) => void;
  onUpdateBand: (bandIndex: number, gain: number) => void;
  onUpdatePreamp: (dB: number) => void;
  onResetFlat: () => void;
}

const BAND_LABELS = [
  { freq: '32Hz', name: 'Sub-Bass' },
  { freq: '64Hz', name: 'Bass' },
  { freq: '125Hz', name: 'Low-Mid' },
  { freq: '250Hz', name: 'Warmth' },
  { freq: '500Hz', name: 'Body' },
  { freq: '1kHz', name: 'Midrange' },
  { freq: '2kHz', name: 'Clarity' },
  { freq: '4kHz', name: 'Presence' },
  { freq: '8kHz', name: 'Treble' },
  { freq: '16kHz', name: 'Air' },
];

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  currentPreset,
  onSelectPreset,
  onUpdateBand,
  onUpdatePreamp,
  onResetFlat,
}) => {
  const curveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [savedPresets, setSavedPresets] = useState<EQPreset[]>(() => {
    try {
      const stored = localStorage.getItem('aura_custom_eq_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Save custom preset
  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: EQPreset = {
      id: 'custom-' + Date.now(),
      name: newPresetName.trim(),
      description: 'User crafted custom frequency curve',
      preamp: currentPreset.preamp,
      gains: [...currentPreset.gains],
      isCustom: true,
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('aura_custom_eq_presets', JSON.stringify(updated));
    onSelectPreset(newPreset);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('aura_custom_eq_presets', JSON.stringify(updated));
    if (currentPreset.id === id) {
      onSelectPreset(PREBUILT_EQ_PRESETS[1]);
    }
  };

  // Draw Spline Frequency Response Curve
  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const minFreq = 20;
    const maxFreq = 20000;
    const minDb = -15;
    const maxDb = 15;

    // Helper functions for logarithmic X and linear Y mapping
    const getX = (freq: number) => {
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const logVal = Math.log10(freq);
      return ((logVal - logMin) / (logMax - logMin)) * width;
    };

    const getY = (dB: number) => {
      const clamped = Math.max(minDb, Math.min(maxDb, dB));
      return height - ((clamped - minDb) / (maxDb - minDb)) * height;
    };

    // Draw Grid Lines (dB markings)
    ctx.lineWidth = 1;
    [-12, -6, 0, 6, 12].forEach(db => {
      const y = getY(db);
      ctx.strokeStyle = db === 0 ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = db === 0 ? '#d4af37' : '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, 8, y - 4);
    });

    // Draw Frequency Grid (vertical)
    [50, 100, 250, 500, 1000, 2000, 5000, 10000].forEach(f => {
      const x = getX(f);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '9px JetBrains Mono';
      const fLabel = f >= 1000 ? `${f / 1000}k` : `${f}`;
      ctx.fillText(fLabel, x + 2, height - 6);
    });

    // Compute and draw the smooth curve across all frequencies
    const points: Array<{ x: number; y: number }> = [];
    const stepCount = 120;

    for (let i = 0; i <= stepCount; i++) {
      const frac = i / stepCount;
      const freq = minFreq * Math.pow(maxFreq / minFreq, frac);
      const x = getX(freq);

      // Estimate composite gain of 10-band filters at this frequency
      let totalGain = currentPreset.preamp;
      currentPreset.gains.forEach((gain, bandIdx) => {
        const centerFreq = EQ_FREQUENCIES[bandIdx];
        const octDiff = Math.abs(Math.log2(freq / centerFreq));
        // Bell curve approximation with bandwidth ~ 1 octave
        const weight = Math.exp(-Math.pow(octDiff / 0.85, 2));
        totalGain += gain * weight;
      });

      const y = getY(totalGain);
      points.push({ x, y });
    }

    // Fill area under curve with glowing audiophile gradient
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    fillGradient.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    fillGradient.addColorStop(0.5, 'rgba(0, 242, 254, 0.2)');
    fillGradient.addColorStop(1, 'rgba(20, 26, 39, 0.0)');

    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(width, getY(0));
    ctx.lineTo(0, getY(0));
    ctx.closePath();
    ctx.fill();

    // Draw the curve line
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw nodes for the 10 bands
    currentPreset.gains.forEach((gain, idx) => {
      const freq = EQ_FREQUENCIES[idx];
      const x = getX(freq);
      const y = getY(gain + currentPreset.preamp);

      ctx.fillStyle = '#0a0d14';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

  }, [currentPreset]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Presets Bar */}
      <div className="bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
                10-Band Constant-Q Graphic EQ
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Real-Time Spline Interpolation
              </span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white mt-1">
              {currentPreset.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {currentPreset.description}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onResetFlat}
              className="px-3 py-1.5 rounded-xl bg-audiophile-850 hover:bg-audiophile-800 border border-audiophile-700 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Flat Bypass
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-glow-purple flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save As Custom
            </button>
          </div>
        </div>

        {/* Preset Selector Badges */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-atmos" />
            <span>Audiophile Master Target Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PREBUILT_EQ_PRESETS.map(preset => {
              const isActive = currentPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                      : 'bg-audiophile-850/80 hover:bg-audiophile-800 border border-audiophile-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Presets If Any */}
        {savedPresets.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-audiophile-800/80">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>User Custom Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map(preset => {
                const isActive = currentPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className={`group px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                        : 'bg-audiophile-850/80 hover:bg-audiophile-800 border border-audiophile-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <button
                      onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Frequency Response Canvas */}
      <div className="bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Interactive Frequency Response Curve (20Hz - 20kHz)</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Preamp: <span className="text-gold-atmos font-bold">{currentPreset.preamp > 0 ? `+${currentPreset.preamp}` : currentPreset.preamp} dB</span>
          </div>
        </div>

        <div className="w-full aspect-[21/8] bg-audiophile-950/90 rounded-xl overflow-hidden border border-audiophile-800/80 p-2 relative">
          <canvas
            ref={curveCanvasRef}
            width={900}
            height={320}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* 10-Band Graphic Faders & Preamp */}
      <div className="bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* Preamp Section */}
          <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-audiophile-850 border border-audiophile-800/80 w-full lg:w-28 flex-shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Preamp
            </span>
            <span className="font-mono text-xs font-bold text-gold-atmos my-2">
              {currentPreset.preamp > 0 ? `+${currentPreset.preamp.toFixed(1)}` : currentPreset.preamp.toFixed(1)} dB
            </span>
            <div className="h-48 flex items-center justify-center my-1">
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={currentPreset.preamp}
                onChange={(e) => onUpdatePreamp(parseFloat(e.target.value))}
                className="fader-vertical"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  width: '6px',
                  height: '180px'
                }}
              />
            </div>
            <button
              onClick={() => onUpdatePreamp(0)}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono mt-2"
            >
              0 dB
            </button>
          </div>

          {/* 10 Band Sliders */}
          <div className="flex-1 grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4 items-stretch">
            {currentPreset.gains.map((gain, idx) => {
              const label = BAND_LABELS[idx];
              const isBoost = gain > 0;
              const isCut = gain < 0;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-audiophile-950/60 border border-audiophile-800/60 hover:border-audiophile-700 transition-colors"
                >
                  {/* Gain readout */}
                  <span className={`font-mono text-[11px] font-bold ${
                    isBoost ? 'text-cyan-400' : isCut ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                    {isBoost ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                  </span>

                  {/* Vertical Fader */}
                  <div className="h-44 flex items-center justify-center my-2">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => onUpdateBand(idx, parseFloat(e.target.value))}
                      onDoubleClick={() => onUpdateBand(idx, 0)}
                      className="fader-vertical accent-cyan-400 cursor-pointer"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        width: '6px',
                        height: '160px'
                      }}
                      title={`${label.freq}: ${gain} dB (Double click to reset)`}
                    />
                  </div>

                  {/* Frequency & Sonic Label */}
                  <div className="text-center">
                    <div className="font-mono text-xs font-bold text-slate-200">
                      {label.freq}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium truncate max-w-[55px]">
                      {label.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-audiophile-900 border border-audiophile-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-display text-white">
              Save Custom EQ Preset
            </h3>
            <p className="text-xs text-slate-400">
              Save your current 10-band equalization curve and preamp adjustments to browser storage.
            </p>
            <input
              type="text"
              placeholder="e.g. Sennheiser HD650 Target, Basshead Bliss"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-audiophile-950 border border-audiophile-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomPreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-glow-purple disabled:opacity-50"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

