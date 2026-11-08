import React, { useState, useEffect } from 'react';
import { Search, Plus, Play, Sparkles, Globe, Link, Music, Disc, X, Check, Filter, Radio, Volume2, Wand2, Sliders, Layers } from 'lucide-react';
import { AudioTrack } from '../types/audio';
import { OnlineTrackResult, searchOnlineTracks, CURATED_ONLINE_TRACKS } from '../services/onlineMusicService';
import { executeAIMusicSearch, AI_PROMPT_PRESETS, AIPromptResult } from '../services/aiMusicSearchService';
import { audioEngine } from '../services/audioEngine';

interface MusicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: AudioTrack) => void;
  onAddTrackToQueue: (track: AudioTrack) => void;
  currentQueue: AudioTrack[];
  initialTab?: 'ai' | 'online' | 'custom_url' | 'queue';
  onApplyEQPreset?: (presetId: string) => void;
}

export const MusicSearchModal: React.FC<MusicSearchModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onAddTrackToQueue,
  currentQueue,
  initialTab = 'ai',
  onApplyEQPreset
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'online' | 'custom_url' | 'queue'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [onlineResults, setOnlineResults] = useState<OnlineTrackResult[]>(CURATED_ONLINE_TRACKS);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  // AI Search states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<AIPromptResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [allQueuedSuccess, setAllQueuedSuccess] = useState(false);
  const [eqApplied, setEqApplied] = useState(false);

  // Custom Stream URL inputs
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customFormat, setCustomFormat] = useState<AudioTrack['format']>('FLAC');
  const [isDolbyAtmosCustom, setIsDolbyAtmosCustom] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const genres = [
    'All',
    'Full Songs',
    'Hollywood',
    'Bollywood',
    'Dolby Atmos',
    'Hi-Fi Radio',
    'Classical',
    'Rock',
    'Electronic',
    'Hip-Hop',
    'Anime',
    'Jazz',
    'Pop'
  ];

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Search online tracks across 80M+ songs with debouncing
  useEffect(() => {
    if (activeTab !== 'online') return;

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
  }, [searchQuery, genreFilter, activeTab]);

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

  // AI Music Search Handler
  const handleRunAISearch = async (promptToRun?: string) => {
    const targetPrompt = (promptToRun || aiPrompt).trim();
    if (!targetPrompt) return;

    setIsGeneratingAI(true);
    setAiError(null);
    setAllQueuedSuccess(false);
    setEqApplied(false);

    try {
      const result = await executeAIMusicSearch(targetPrompt);
      setAiResult(result);
    } catch (err: any) {
      setAiError(err.message || 'AI Music search failed to generate setlist');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleQueueAllAITracks = async () => {
    if (!aiResult || aiResult.recommendedTracks.length === 0) return;

    for (const onlineTrack of aiResult.recommendedTracks) {
      const track = await handleConvertOnlineToAudioTrack(onlineTrack);
      onAddTrackToQueue(track);
    }

    setAllQueuedSuccess(true);
    setTimeout(() => setAllQueuedSuccess(false), 2500);
  };

  const handleApplyAIEqPreset = () => {
    if (aiResult?.suggestedEqPresetId) {
      if (onApplyEQPreset) {
        onApplyEQPreset(aiResult.suggestedEqPresetId);
      } else {
        audioEngine.setPresetById(aiResult.suggestedEqPresetId);
      }
      setEqApplied(true);
      setTimeout(() => setEqApplied(false), 2500);
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
        console.warn("Direct buffer fetch was CORS restricted; will stream via audio element:", decodeErr);
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
        isFullPlayback: true,
        qualityBadge: 'Full Stream',
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  AURA AI Music Discovery & Universal Library
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  80M+ Full Playback
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                AI Natural Language Mood Search &bull; Hollywood, Bollywood, Classical, Synthwave & All Genres
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
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-glow-purple font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-300" />
            ✨ AI Music Assistant
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'online'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global 80M+ Library
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
            Custom Stream URL
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4" />
            Queue ({currentQueue.length})
          </button>
        </div>

        {/* TAB 1: AI MUSIC ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* AI Prompt Input Card */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-audiophile-950 via-audiophile-900 to-audiophile-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Describe Any Mood, Movie, Scene or Musical Archetype:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Natural Language AI Query
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 'Epic Hans Zimmer Hollywood scores with massive orchestral soundstage', 'Soulful romantic Bollywood acoustics', 'Cyberpunk neon synthwave'..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunAISearch();
                    }
                  }}
                  className="w-full pl-4 pr-28 py-3 rounded-xl bg-audiophile-950 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
                />
                <button
                  onClick={() => handleRunAISearch()}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isGeneratingAI || !aiPrompt.trim()
                      ? 'bg-audiophile-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-glow-purple'
                  }`}
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  {isGeneratingAI ? 'Synthesizing...' : 'Ask AI'}
                </button>
              </div>

              {/* Instant Prompt Preset Pills */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-mono block">
                  Quick AI Inspiration Pills:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-none">
                  {AI_PROMPT_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setAiPrompt(preset.prompt);
                        handleRunAISearch(preset.prompt);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all hover:scale-105 active:scale-95 bg-gradient-to-r ${preset.gradient}`}
                      title={preset.prompt}
                    >
                      {preset.badge}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Error Display */}
            {aiError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
                {aiError}
              </div>
            )}

            {/* AI Results & Curation Analysis Card */}
            {aiResult && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-audiophile-950/90 border border-indigo-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-display">
                          {aiResult.inferredGenre}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                          {aiResult.inferredMood}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-1 leading-relaxed">
                        {aiResult.acousticNote}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {aiResult.suggestedEqPresetId && (
                        <button
                          onClick={handleApplyAIEqPreset}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                            eqApplied
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-audiophile-850 hover:bg-audiophile-800 text-gold-glow border-gold-atmos/40 hover:border-gold-atmos'
                          }`}
                          title="Auto-tune 10-Band EQ to match this acoustic profile"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          {eqApplied ? 'EQ Tuned!' : 'Tune EQ'}
                        </button>
                      )}

                      <button
                        onClick={handleQueueAllAITracks}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          allQueuedSuccess
                            ? 'bg-emerald-500 text-black font-extrabold'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-glow-purple'
                        }`}
                        title="Add all AI recommended tracks to queue"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {allQueuedSuccess ? 'All Added!' : `Queue All (${aiResult.recommendedTracks.length})`}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Track Results List */}
                <div className="space-y-2">
                  {aiResult.recommendedTracks.map(track => {
                    const isAdded = addedTrackIds.has(track.id);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-audiophile-950/70 border border-audiophile-800 hover:border-purple-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-audiophile-900 border border-audiophile-800 flex-shrink-0 flex items-center justify-center">
                            <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate font-display group-hover:text-purple-300 transition-colors">
                              {track.title}
                            </h4>
                            <p className="text-xs text-slate-400 truncate">
                              {track.artist} &bull; <span className="text-slate-500">{track.album}</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                FULL PLAYBACK
                              </span>
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
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
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
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GLOBAL 80M+ CATALOG SEARCH */}
        {activeTab === 'online' && (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            {/* Search Bar */}
            <div className="relative flex-shrink-0">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                isSearching ? 'text-gold-atmos animate-spin' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Search across Hollywood, Bollywood, Rock, Classical, Pop, Synthwave (e.g. Hans Zimmer, Arijit Singh, Kishore Kumar, Queen, Daft Punk)..."
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

            {/* Genre Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-shrink-0">
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

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {onlineResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No tracks match "{searchQuery}". Try searching for "Hans Zimmer", "Arijit Singh", "Interstellar", or "Queen".
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
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM URL STREAM INGESTION */}
        {activeTab === 'custom_url' && (
          <form onSubmit={handleAddCustomStream} className="space-y-4 p-4 rounded-xl bg-audiophile-950/80 border border-audiophile-800 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                Audio Stream URL *
              </label>
              <input
                type="url"
                placeholder="https://example.com/stream.flac or .mp3, .wav, .m3u8, radio stream"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Supports bit-perfect FLAC, uncompressed WAV, high-bitrate AAC, MP3, and Live HLS streams.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                  Track / Station Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audiophile Master Stream"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                  Artist / Broadcaster
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Tape Vault"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-bold text-slate-300 font-mono block mb-1">
                  Format Tag
                </label>
                <select
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-audiophile-900 border border-audiophile-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="FLAC">FLAC (24-bit Lossless)</option>
                  <option value="WAV">WAV (PCM Master)</option>
                  <option value="AAC">AAC (High Definition)</option>
                  <option value="MP3">MP3 (320 kbps)</option>
                  <option value="OGG">OGG (Vorbis)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="atmos-custom"
                  checked={isDolbyAtmosCustom}
                  onChange={(e) => setIsDolbyAtmosCustom(e.target.checked)}
                  className="w-4 h-4 rounded border-audiophile-700 bg-audiophile-900 text-gold-atmos focus:ring-0 cursor-pointer"
                />
                <label htmlFor="atmos-custom" className="text-xs font-mono text-slate-300 cursor-pointer select-none">
                  Enable Dolby Atmos 7.1.4 Bed
                </label>
              </div>
            </div>

            {customError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
                {customError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingCustom}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-glow-cyan"
            >
              {isLoadingCustom ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting Audio Stream...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Connect & Stream Now
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 4: CURRENT PLAYLIST QUEUE SEARCH */}
        {activeTab === 'queue' && (
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter tracks in your current queue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-audiophile-950 border border-audiophile-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {queueResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No tracks in queue match "{searchQuery}".
                </div>
              ) : (
                queueResults.map(track => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-audiophile-950/70 border border-audiophile-800 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-audiophile-900 border border-audiophile-800 flex-shrink-0 flex items-center justify-center">
                        {track.coverArt ? (
                          <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate font-display">{track.title}</h4>
                        <p className="text-xs text-slate-400 truncate">{track.artist} &bull; {track.album}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onPlayTrack(track);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-audiophile-850 hover:bg-audiophile-800 text-cyan-300 hover:text-white border border-audiophile-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
