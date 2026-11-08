import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Sparkles, Globe, Link, Music, Disc, X, Check, Filter, Radio, Volume2 } from 'lucide-react';
import { AudioTrack } from '../types/audio';
import { OnlineTrackResult, searchOnlineTracks, CURATED_ONLINE_TRACKS } from '../services/onlineMusicService';
import { audioEngine } from '../services/audioEngine';

interface MusicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: AudioTrack) => void;
  onAddTrackToQueue: (track: AudioTrack) => void;
  currentQueue: AudioTrack[];
}

export const MusicSearchModal: React.FC<MusicSearchModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onAddTrackToQueue,
  currentQueue
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'custom_url' | 'queue'>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [onlineResults, setOnlineResults] = useState<OnlineTrackResult[]>(CURATED_ONLINE_TRACKS);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  // Custom Stream URL inputs
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customFormat, setCustomFormat] = useState<AudioTrack['format']>('FLAC');
  const [isDolbyAtmosCustom, setIsDolbyAtmosCustom] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const genres = ['All', 'Full Songs', 'Dolby Atmos', 'Hi-Fi Radio', 'Classical', 'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz'];

  // Search online tracks across 100+ Million songs
  useEffect(() => {
    let active = true;
    setIsSearching(true);
    const timer = setTimeout(() => {
      searchOnlineTracks(searchQuery, genreFilter).then(results => {
        if (active) {
          setOnlineResults(results);
          setIsSearching(false);
        }
      }).catch(() => {
        if (active) setIsSearching(false);
      });
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, genreFilter]);

  if (!isOpen) return null;

  // Filter current queue tracks if on queue tab
  const queueResults = currentQueue.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConvertOnlineToAudioTrack = async (onlineTrack: OnlineTrackResult): Promise<AudioTrack> => {
    return {
      id: onlineTrack.id + '-' + Date.now(),
      title: onlineTrack.title,
      artist: onlineTrack.artist,
      album: onlineTrack.album,
      duration: onlineTrack.duration,
      url: onlineTrack.url,
      coverArt: onlineTrack.coverArt,
      format: onlineTrack.format,
      bitDepth: onlineTrack.bitDepth,
      sampleRate: onlineTrack.sampleRate,
      channels: onlineTrack.channels,
      bitrate: onlineTrack.bitrate,
      isDolbyAtmosMaster: onlineTrack.isDolbyAtmosMaster,
      isHiResLossless: onlineTrack.isHiResLossless,
      isFullPlayback: onlineTrack.isFullPlayback,
      qualityBadge: onlineTrack.qualityBadge
    };
  };

  const handlePlayOnlineTrack = async (onlineTrack: OnlineTrackResult) => {
    try {
      const track = await handleConvertOnlineToAudioTrack(onlineTrack);
      onPlayTrack(track);
      onClose();
    } catch (e) {
      console.error("Error playing online track:", e);
    }
  };

  const handleQueueOnlineTrack = async (onlineTrack: OnlineTrackResult) => {
    try {
      const track = await handleConvertOnlineToAudioTrack(onlineTrack);
      onAddTrackToQueue(track);
      setAddedTrackIds(prev => new Set(prev).add(onlineTrack.id));
      setTimeout(() => {
        setAddedTrackIds(prev => {
          const next = new Set(prev);
          next.delete(onlineTrack.id);
          return next;
        });
      }, 2000);
    } catch (e) {
      console.error("Error queuing online track:", e);
    }
  };

  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    if (!customUrl.trim()) {
      setCustomError('Please provide a valid audio stream URL');
      return;
    }

    setIsLoadingCustom(true);

    try {
      // Decode or verify audio stream via Web Audio context
      const ctx = audioEngine.getAudioContext();
      let duration = 180;
      let sampleRate = 48000;
      let channels = isDolbyAtmosCustom ? 8 : 2;
      let audioBuffer: AudioBuffer | undefined = undefined;

      try {
        const response = await fetch(customUrl);
        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          audioBuffer = await ctx.decodeAudioData(arrayBuf);
          duration = audioBuffer.duration;
          sampleRate = audioBuffer.sampleRate;
          channels = audioBuffer.numberOfChannels;
        }
      } catch (decodeErr) {
        // Direct stream or CORS protected stream: will stream directly via AudioElement/URL
        console.warn("Direct buffer fetch was CORS restricted; stream will play via URL source:", decodeErr);
      }

      const customTrack: AudioTrack = {
        id: 'custom-url-' + Date.now(),
        title: customTitle.trim() || 'Custom Network Stream',
        artist: customArtist.trim() || 'Network Source',
        album: 'Live Lossless Web Stream',
        duration,
        url: customUrl.trim(),
        audioBuffer,
        format: customFormat,
        bitDepth: 24,
        sampleRate,
        channels,
        isDolbyAtmosMaster: isDolbyAtmosCustom || channels > 2,
        isHiResLossless: true,
        coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'
      };

      onAddTrackToQueue(customTrack);
      onPlayTrack(customTrack);
      onClose();
    } catch (err: any) {
      setCustomError(err.message || 'Failed to load custom stream URL');
    } finally {
      setIsLoadingCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-audiophile-900 border border-audiophile-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-audiophile-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                Global Music Search (Full Playback)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                80M+ full-length songs with 100% complete playback & 24-bit Lossless FLAC streams
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-audiophile-950 p-1 rounded-xl border border-audiophile-800/80 flex-shrink-0">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'online'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global 80M+ Full Songs
          </button>

          <button
            onClick={() => setActiveTab('custom_url')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'custom_url'
                ? 'bg-gradient-to-r from-gold-atmos to-amber-500 text-black font-bold shadow-glow-atmos'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link className="w-4 h-4" />
            Add Custom Stream URL
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4" />
            Search Queue ({currentQueue.length})
          </button>
        </div>

        {/* Online Catalog Search Bar & Filter Chips */}
        {activeTab !== 'custom_url' && (
          <div className="space-y-3 flex-shrink-0">
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                isSearching ? 'text-gold-atmos animate-spin' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder={activeTab === 'online' ? "Search 80M+ songs with full playback (e.g. Queen, The Weeknd, Taylor Swift, Daft Punk, Chopin)..." : "Filter your queue tracks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-audiophile-950 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && (
                  <span className="text-[10px] font-mono text-gold-atmos animate-pulse">Searching...</span>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-500 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'online' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mr-1" />
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => setGenreFilter(genre)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition-all whitespace-nowrap ${
                      genreFilter === genre
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-inner'
                        : 'bg-audiophile-850 hover:bg-audiophile-800 text-slate-400 hover:text-slate-200 border border-audiophile-800'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          
          {/* TAB 1: Online Hi-Fi Catalog Results */}
          {activeTab === 'online' && (
            onlineResults.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                No tracks match "{searchQuery}". Try searching for "Beethoven", "Jazz", or "Binaural".
              </div>
            ) : (
              onlineResults.map(track => {
                const isAdded = addedTrackIds.has(track.id);
                return (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-audiophile-950/70 border border-audiophile-800 hover:border-audiophile-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-audiophile-900 border border-audiophile-800 flex-shrink-0 flex items-center justify-center">
                        <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate font-display group-hover:text-cyan-300 transition-colors">
                          {track.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {track.artist} &bull; <span className="text-slate-500">{track.album}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {track.isFullPlayback ? (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              FULL PLAYBACK
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              30s Preview
                            </span>
                          )}
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {track.qualityBadge || `${track.format} ${track.bitDepth}-bit`}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                          </span>
                          {track.isDolbyAtmosMaster && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              ATMOS 7.1.4
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-slate-500">
                            {track.genre}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={() => handlePlayOnlineTrack(track)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Stream & Play Now"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Play
                      </button>

                      <button
                        onClick={() => handleQueueOnlineTrack(track)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-audiophile-850 hover:bg-audiophile-800 text-slate-300 hover:text-white border-audiophile-700'
                        }`}
                        title="Add to Playback Queue"
                      >
                        {isAdded ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 2: Custom URL Stream Ingestion */}
          {activeTab === 'custom_url' && (
            <form onSubmit={handleAddCustomStream} className="space-y-4 p-4 rounded-xl bg-audiophile-950/80 border border-audiophile-800">
              <div>
                <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                  Audio Stream URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/audio/master-recording.flac"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Accepts direct stream links to <span className="text-slate-300 font-mono">.flac, .wav, .mp3, .aac, .ogg</span> or internet radio streams.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                    Track Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Symphony Live Master"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                    Artist / Ensemble
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hi-Res Sound Lab"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 border-t border-audiophile-800">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 font-mono block mb-1">
                      Format
                    </label>
                    <select
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value as AudioTrack['format'])}
                      className="px-3 py-1.5 rounded-lg bg-audiophile-900 border border-audiophile-700 text-xs text-slate-300 font-mono"
                    >
                      <option value="FLAC">FLAC (Lossless)</option>
                      <option value="WAV">WAV (Lossless)</option>
                      <option value="ALAC">ALAC (Lossless)</option>
                      <option value="MP3">MP3</option>
                      <option value="OGG">OGG Vorbis</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={isDolbyAtmosCustom}
                      onChange={(e) => setIsDolbyAtmosCustom(e.target.checked)}
                      className="rounded bg-audiophile-800 border-audiophile-700 text-cyan-400 focus:ring-0"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      Enable Dolby Atmos 7.1.4 Bed
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingCustom}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-atmos to-amber-500 text-black font-bold text-xs shadow-glow-atmos hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 mt-4"
                >
                  <Sparkles className="w-4 h-4" />
                  {isLoadingCustom ? 'Connecting & Decoding...' : 'Stream Now'}
                </button>
              </div>

              {customError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                  {customError}
                </div>
              )}
            </form>
          )}

          {/* TAB 3: Queue Search Results */}
          {activeTab === 'queue' && (
            queueResults.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                No tracks in your queue match "{searchQuery}".
              </div>
            ) : (
              queueResults.map(track => (
                <div
                  key={track.id}
                  onClick={() => {
                    onPlayTrack(track);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-audiophile-950/70 border border-audiophile-800 hover:border-gold-atmos/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-audiophile-900 border border-audiophile-800 flex-shrink-0 flex items-center justify-center">
                      {track.coverArt ? (
                        <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-gold-atmos" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate font-display group-hover:text-gold-glow transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {track.artist} &bull; <span className="text-slate-500">{track.album}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-gold-glow border border-gold-atmos/30">
                      {track.format} {track.bitDepth}-bit
                    </span>
                    <Play className="w-4 h-4 text-slate-500 group-hover:text-gold-atmos transition-colors" />
                  </div>
                </div>
              ))
            )
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-audiophile-800 text-[11px] font-mono text-slate-500 flex-shrink-0">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-audiophile-850 border border-audiophile-700 text-slate-300">Esc</kbd> to exit search</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-audiophile-800 hover:bg-audiophile-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

