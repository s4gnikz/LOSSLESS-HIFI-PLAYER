import React, { useState } from 'react';
import { AudioTrack } from '../types/audio';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  Sparkles,
  Layers,
  Sliders,
  ShieldCheck,
  Disc,
  Info
} from 'lucide-react';

interface PlayerControlsProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoop: boolean;
  isShuffle: boolean;
  isAbCompareOriginal: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onToggleAbCompare: () => void;
  onOpenTrackDetails?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLoop,
  isShuffle,
  isAbCompareOriginal,
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleShuffle,
  onToggleAbCompare,
  onOpenTrackDetails,
}) => {
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(e.clientX - rect.left);
    setHoverSeekTime(frac * duration);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-audiophile-950/95 border-t border-audiophile-800/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 fixed bottom-0 left-0 right-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* Seek Bar with Hover Preview */}
        <div className="flex items-center gap-3 w-full group">
          <span className="font-mono text-[11px] text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="flex-1 py-1.5 cursor-pointer relative group/bar"
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={() => setHoverSeekTime(null)}
            onClick={handleProgressBarClick}
          >
            {/* Visual Track */}
            <div className="w-full h-2 bg-audiophile-850 rounded-full relative overflow-visible group-hover/bar:h-2.5 transition-all">
              {/* Progress Fill */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-gold-atmos relative transition-[width] duration-150 ease-linear"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] scale-0 group-hover/bar:scale-100 transition-transform" />
              </div>
            </div>

            {/* Hover Tooltip */}
            {hoverSeekTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-audiophile-900 border border-audiophile-700 text-[10px] font-mono text-white shadow-lg pointer-events-none"
                style={{ left: `${hoverPosition}px` }}
              >
                {formatTime(hoverSeekTime)}
              </div>
            )}
          </div>

          <span className="font-mono text-[11px] text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Layout: Track Info (Left), Playback Buttons (Center), Volume & A/B (Right) */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Current Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-1/4">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-audiophile-900 border border-audiophile-800 flex-shrink-0 flex items-center justify-center shadow-md">
              {currentTrack?.coverArt ? (
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                />
              ) : (
                <Disc className={`w-7 h-7 text-gold-atmos ${isPlaying ? 'animate-spin' : ''}`} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4
                  onClick={onOpenTrackDetails}
                  className="text-sm font-bold text-white truncate font-display cursor-pointer hover:text-gold-glow transition-colors"
                  title="Click to view full audio stream forensic telemetry"
                >
                  {currentTrack?.title || 'No Track Selected'}
                </h4>
                {currentTrack && (
                  <button
                    onClick={onOpenTrackDetails}
                    className="text-slate-500 hover:text-cyan-300 transition-colors p-0.5"
                    title="Audio Stream Telemetry Inspector"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                <span>{currentTrack?.artist || 'Select or drop music'}</span>
                {currentTrack?.album && (
                  <>
                    <span>&bull;</span>
                    <span className="truncate">{currentTrack.album}</span>
                  </>
                )}
              </div>

              {/* Audiophile Badges */}
              <div className="flex items-center gap-1.5 mt-0.5 cursor-pointer flex-wrap" onClick={onOpenTrackDetails}>
                {currentTrack?.isFullPlayback && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    FULL
                  </span>
                )}
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-gold-glow border border-gold-atmos/40 hover:bg-amber-500/30 transition-colors">
                  {currentTrack ? (currentTrack.qualityBadge || `${currentTrack.format} ${currentTrack.bitDepth}-bit/${(currentTrack.sampleRate / 1000).toFixed(1)}kHz`) : '24-bit Hi-Res'}
                </span>
                {currentTrack?.isDolbyAtmosMaster && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors">
                    ATMOS 7.1.4
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Playback Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              {/* Shuffle */}
              <button
                onClick={onToggleShuffle}
                className={`p-2 rounded-lg transition-colors ${
                  isShuffle ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Shuffle Queue"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev */}
              <button
                onClick={onPrev}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Play / Pause Master Button */}
              <button
                onClick={onPlayPause}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold-atmos via-amber-400 to-yellow-300 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow-atmos"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-black" />
                ) : (
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Repeat */}
              <button
                onClick={onToggleLoop}
                className={`p-2 rounded-lg transition-colors ${
                  isLoop ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Loop Current Track"
              >
                {isLoop ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Controls: A/B Instant Compare + Volume */}
          <div className="flex items-center justify-end gap-4 w-1/4">
            
            {/* A/B Instant Compare Mode */}
            <button
              onClick={onToggleAbCompare}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
                isAbCompareOriginal
                  ? 'bg-amber-500/20 text-gold-glow border-gold-atmos/50 shadow-glow-atmos'
                  : 'bg-audiophile-900 text-slate-300 border-audiophile-800 hover:border-slate-600'
              }`}
              title="A/B Compare: Instantly compare Dolby Atmos 3D & EQ vs Raw Flat Master"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAbCompareOriginal ? 'ORIGINAL FLAT' : 'ATMOS 3D / EQ'}</span>
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5 text-slate-300" />
                ) : (
                  <Volume2 className="w-5 h-5 text-slate-200" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 lg:w-28 h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-gold-atmos"
              />
              
              <span className="font-mono text-[10px] text-slate-400 w-7">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

