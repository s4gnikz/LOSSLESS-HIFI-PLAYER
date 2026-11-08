import React from 'react';
import { Sparkles, Sliders, Volume2, ShieldCheck, Github, Radio, CheckCircle2 } from 'lucide-react';
import { AudioEngineMetrics } from '../types/audio';

interface HeaderProps {
  metrics: AudioEngineMetrics;
  isBitPerfect: boolean;
  onToggleBitPerfect: () => void;
  onOpenGitHubModal: () => void;
  activeTab: 'player' | 'spatial' | 'eq' | 'visualizer';
  setActiveTab: (tab: 'player' | 'spatial' | 'eq' | 'visualizer') => void;
  isDolbyAtmosActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  isBitPerfect,
  onToggleBitPerfect,
  onOpenGitHubModal,
  activeTab,
  setActiveTab,
  isDolbyAtmosActive
}) => {
  return (
    <header className="border-b border-audiophile-800 bg-audiophile-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('player')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gold-atmos via-amber-500 to-yellow-600 shadow-glow-atmos">
              <Radio className="w-5 h-5 text-black animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-wider text-white">AURA</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-gold-glow border border-gold-atmos/40">
                  HI-FI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 inline" /> Ad-Free
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                Lossless 192kHz/24-Bit &bull; 7.1.4 Dolby Atmos Engine
              </p>
            </div>
          </div>

          {/* Mobile GitHub Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenGitHubModal}
              className="p-2 rounded-lg bg-audiophile-850 hover:bg-audiophile-800 border border-audiophile-700 text-slate-300"
              title="GitHub Push & Sync"
            >
              <Github className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-audiophile-900/90 p-1 rounded-xl border border-audiophile-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-gold-atmos to-amber-500 text-black shadow-glow-atmos'
                : 'text-slate-400 hover:text-white hover:bg-audiophile-800/60'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Player & Queue
          </button>

          <button
            onClick={() => setActiveTab('spatial')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'spatial'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white hover:bg-audiophile-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dolby Atmos 7.1.4
            {isDolbyAtmosActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('eq')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'eq'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white hover:bg-audiophile-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Equalizer
          </button>

          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'visualizer'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-audiophile-800/60'
            }`}
          >
            <span className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-2 bg-current rounded-full" />
              <span className="w-0.5 h-3 bg-current rounded-full" />
              <span className="w-0.5 h-1.5 bg-current rounded-full" />
            </span>
            Visualizer
          </button>
        </nav>

        {/* DAC / Audiophile Engine Hardware Status & Bit-Perfect Mode */}
        <div className="hidden md:flex items-center gap-3">
          {/* Bit-Perfect Master Bypass */}
          <button
            onClick={onToggleBitPerfect}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all border flex items-center gap-1.5 ${
              isBitPerfect
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-inner'
                : 'bg-audiophile-900 text-slate-400 border-audiophile-800 hover:text-slate-200'
            }`}
            title="Bit-Perfect Mode: Bypasses all DSP/EQ for untouched bit-for-bit master output"
          >
            <span className={`w-2 h-2 rounded-full ${isBitPerfect ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
            Bit-Perfect: {isBitPerfect ? 'ON' : 'OFF'}
          </button>

          {/* Hardware DAC Info */}
          <div className="bg-audiophile-900 border border-audiophile-800/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="text-gold-atmos font-semibold">
              {(metrics.contextSampleRate / 1000).toFixed(1)} kHz
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-300">32-bit Float</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">{metrics.channelCount}ch</span>
          </div>

          {/* GitHub Sync Button */}
          <button
            onClick={onOpenGitHubModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-audiophile-850 hover:bg-audiophile-800 text-slate-200 hover:text-white border border-audiophile-700 text-xs font-medium transition-all shadow-sm"
          >
            <Github className="w-3.5 h-3.5 text-gold-atmos" />
            <span>GitHub Sync</span>
          </button>
        </div>

      </div>
    </header>
  );
};
