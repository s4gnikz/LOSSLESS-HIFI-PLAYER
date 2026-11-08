import React, { useRef, useState } from 'react';
import { AudioTrack } from '../types/audio';
import {
  Upload,
  FolderPlus,
  Play,
  Pause,
  Trash2,
  Music,
  Disc,
  Sparkles,
  Info,
  Radio,
  FileAudio,
  CheckCircle2
} from 'lucide-react';
import { parseAudioFile } from '../services/audioParser';
import { PRESET_DEMO_TRACKS, generateDemoAudioBuffer } from '../services/demoTracks';
import { audioEngine } from '../services/audioEngine';

interface PlaylistQueueProps {
  tracks: AudioTrack[];
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onSelectTrack: (track: AudioTrack) => void;
  onAddTracks: (newTracks: AudioTrack[]) => void;
  onRemoveTrack: (trackId: string) => void;
  onClearPlaylist: () => void;
  onRestoreDemos: () => void;
}

export const PlaylistQueue: React.FC<PlaylistQueueProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onAddTracks,
  onRemoveTrack,
  onClearPlaylist,
  onRestoreDemos
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newTracks: AudioTrack[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(flac|wav|aiff|alac|ogg|mp3|aac|m4a)$/i)) {
        continue;
      }

      try {
        const metadata = await parseAudioFile(file);
        // Decode audio buffer for gapless lossless playback
        const audioBuffer = await audioEngine.decodeAudioFile(file);

        const track: AudioTrack = {
          id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.artist || 'Local Master',
          album: metadata.album || 'Hi-Fi Library',
          duration: audioBuffer.duration,
          blob: file,
          audioBuffer,
          format: metadata.format || 'FLAC',
          bitDepth: metadata.bitDepth || 24,
          sampleRate: metadata.sampleRate || audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          bitrate: Math.round((file.size * 8) / (audioBuffer.duration * 1000)),
          isDolbyAtmosMaster: metadata.isDolbyAtmosMaster,
          isHiResLossless: metadata.isHiResLossless || audioBuffer.sampleRate >= 48000,
          coverArt: metadata.coverArt
        };

        newTracks.push(track);
      } catch (err) {
        console.error('Error decoding file:', file.name, err);
      }
    }

    if (newTracks.length > 0) {
      onAddTracks(newTracks);
    }
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Drag & Drop Import Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
          isDraggingOver
            ? 'border-cyan-400 bg-cyan-950/40 shadow-glow-cyan'
            : 'border-audiophile-800 bg-audiophile-900/60 hover:border-audiophile-700 hover:bg-audiophile-900'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".flac,.wav,.aiff,.alac,.mp3,.aac,.ogg,audio/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-atmos/20 to-cyan-500/20 border border-gold-atmos/30 flex items-center justify-center text-gold-glow shadow-glow-atmos">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold font-display text-white">
              {isProcessing ? 'Decoding Lossless Stream...' : 'Drag & Drop Lossless Audio Files Here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
              Supports <span className="text-cyan-400 font-mono font-semibold">FLAC, WAV, ALAC, AIFF, DSD-PCM, MP3</span> up to 192kHz / 24-bit with embedded artwork and Dolby Atmos bed channels.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-atmos to-amber-500 text-black font-bold text-xs shadow-glow-atmos hover:scale-105 transition-all flex items-center gap-2"
            >
              <FileAudio className="w-4 h-4" />
              Browse Local Files
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestoreDemos();
              }}
              className="px-4 py-2 rounded-xl bg-audiophile-800 hover:bg-audiophile-700 text-slate-200 font-semibold text-xs border border-audiophile-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Load Hi-Res Demos
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Header & Controls */}
      <div className="bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-audiophile-800">
          <div>
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-gold-atmos" />
              Playback Queue & Library
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-audiophile-800 text-slate-300">
                {tracks.length} tracks
              </span>
            </h3>
          </div>

          {tracks.length > 0 && (
            <button
              onClick={onClearPlaylist}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Queue
            </button>
          )}
        </div>

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            No tracks in queue. Drop FLAC/WAV files above or click "Load Hi-Res Demos".
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, idx) => {
              const isSelected = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-audiophile-800 to-audiophile-850 border-gold-atmos/50 shadow-md ring-1 ring-gold-atmos/30'
                      : 'bg-audiophile-950/60 hover:bg-audiophile-850 border-audiophile-800/80 hover:border-audiophile-700'
                  }`}
                >
                  {/* Left: Index / Play Icon / Album Art & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 text-center text-xs font-mono text-slate-500 group-hover:text-white">
                      {isSelected && isPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3">
                          <span className="w-0.5 h-2 bg-gold-atmos animate-sound-wave" />
                          <span className="w-0.5 h-3 bg-gold-atmos animate-sound-wave [animation-delay:0.2s]" />
                          <span className="w-0.5 h-1.5 bg-gold-atmos animate-sound-wave [animation-delay:0.4s]" />
                        </div>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-audiophile-900 border border-audiophile-800 flex-shrink-0 flex items-center justify-center">
                      {track.coverArt ? (
                        <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate font-display">
                        {track.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {track.artist} &bull; <span className="text-slate-500">{track.album}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Audiophile Specs & Duration */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Hi-Res Badge */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/10 text-gold-glow border border-gold-atmos/30">
                        {track.format} {track.bitDepth}-bit / {(track.sampleRate / 1000).toFixed(1)}kHz
                      </span>

                      {track.isDolbyAtmosMaster && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          ATMOS 7.1.4
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-xs text-slate-400">
                      {formatDuration(track.duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-audiophile-800 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

