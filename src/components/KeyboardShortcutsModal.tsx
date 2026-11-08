import React from 'react';
import { Command, X, Volume2, Sparkles, Sliders, ShieldCheck } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause stream' },
    { key: '→', desc: 'Seek forward 5 seconds' },
    { key: '←', desc: 'Seek backward 5 seconds' },
    { key: '↑', desc: 'Increase volume by 5%' },
    { key: '↓', desc: 'Decrease volume by 5%' },
    { key: 'M', desc: 'Toggle Mute / Unmute' },
    { key: 'S', desc: 'Toggle Dolby Atmos 3D Spatializer' },
    { key: 'B', desc: 'Toggle Bit-Perfect Master Bypass' },
    { key: 'A', desc: 'Toggle A/B Instant Listening Comparison' },
    { key: 'P', desc: 'Toggle Stop After Song mode' },
    { key: 'Ctrl+J', desc: 'Open AI Music Search & Discovery' },
    { key: 'Ctrl+K', desc: 'Open 80M+ Library Search' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-audiophile-900 border border-audiophile-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-audiophile-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-atmos/20 border border-gold-atmos/40 text-gold-glow">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Audiophile Keyboard Shortcuts
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Hardware-Level Tactile Playback Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-audiophile-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-audiophile-950/70 border border-audiophile-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-audiophile-850 border border-audiophile-700 font-mono font-bold text-gold-glow text-[11px] shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-audiophile-800 hover:bg-audiophile-700 text-white text-xs font-semibold"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

