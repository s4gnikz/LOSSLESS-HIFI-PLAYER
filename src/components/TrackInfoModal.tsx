import React from 'react';
import { AudioTrack } from '../types/audio';
import { FileText, Cpu, Activity, Disc, CheckCircle, ShieldAlert, Sparkles, X } from 'lucide-react';

interface TrackInfoModalProps {
  track: AudioTrack | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TrackInfoModal: React.FC<TrackInfoModalProps> = ({ track, isOpen, onClose }) => {
  if (!isOpen || !track) return null;

  const nyquistFreq = track.sampleRate / 2;
  const theoreticalDynamicRange = track.bitDepth * 6.02; // in dB (e.g. 144 dB for 24-bit)
  const isHiRes = track.bitDepth >= 24 && track.sampleRate >= 48000;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-audiophile-900 border border-audiophile-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-audiophile-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-atmos/20 border border-gold-atmos/40 text-gold-glow">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Audio Stream Telemetry & Forensic Inspector
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Lossless Bit-Depth & Nyquist Spectral Verification
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

        {/* Track Title Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-audiophile-950/80 border border-audiophile-800">
          <div className="w-12 h-12 rounded-lg bg-audiophile-900 border border-audiophile-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {track.coverArt ? (
              <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <Disc className="w-6 h-6 text-gold-atmos" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate font-display">{track.title}</h4>
            <p className="text-xs text-slate-400 truncate">{track.artist} &bull; {track.album}</p>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-audiophile-850/70 border border-audiophile-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Container / Codec</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{track.format} (Lossless)</span>
          </div>

          <div className="p-3 rounded-xl bg-audiophile-850/70 border border-audiophile-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Quantization Depth</span>
            <span className="text-cyan-400 font-bold text-sm mt-0.5 block">{track.bitDepth}-Bit Integer / Float</span>
          </div>

          <div className="p-3 rounded-xl bg-audiophile-850/70 border border-audiophile-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Sampling Frequency</span>
            <span className="text-gold-glow font-bold text-sm mt-0.5 block">
              {(track.sampleRate / 1000).toFixed(1)} kHz ({track.sampleRate.toLocaleString()} Hz)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-audiophile-850/70 border border-audiophile-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Nyquist Bandwidth</span>
            <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
              0 Hz - {(nyquistFreq / 1000).toFixed(1)} kHz
            </span>
          </div>

          <div className="p-3 rounded-xl bg-audiophile-850/70 border border-audiophile-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Theoretical Dynamic Range</span>
            <span className="text-indigo-400 font-bold text-sm mt-0.5 block">{theoreticalDynamicRange.toFixed(1)} dB SNR</span>
          </div>

          <div className="p-3 rounded-xl bg-audiophile-850/70 border border-audiophile-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Spatial Soundstage</span>
            <span className="text-amber-400 font-bold text-sm mt-0.5 block">
              {track.isDolbyAtmosMaster ? 'Dolby Atmos 7.1.4 Bed' : `${track.channels}.0 Stereo Master`}
            </span>
          </div>
        </div>

        {/* High-Resolution Verification Badge */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
          isHiRes
            ? 'bg-amber-500/10 border-gold-atmos/40 text-gold-glow'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold font-mono block">
              {isHiRes ? 'CERTIFIED HI-RES LOSSLESS AUDIO' : 'STANDARD CD QUALITY LOSSLESS (16-BIT / 44.1kHz)'}
            </span>
            <span className="text-slate-400 text-[11px] block mt-0.5">
              {isHiRes
                ? 'Ultra high-definition sampling preserves ultrasonic harmonics beyond the limits of human hearing.'
                : 'Pristine bit-for-bit uncompressed studio master audio playback.'}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-audiophile-800 hover:bg-audiophile-700 text-white text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
