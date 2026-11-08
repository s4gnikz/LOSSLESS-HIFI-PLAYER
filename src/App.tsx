import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PlayerControls } from './components/PlayerControls';
import { SpatialAtmosPanel } from './components/SpatialAtmosPanel';
import { EqualizerPanel } from './components/EqualizerPanel';
import { VisualizerPanel } from './components/VisualizerPanel';
import { PlaylistQueue } from './components/PlaylistQueue';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { audioEngine, PREBUILT_EQ_PRESETS } from './services/audioEngine';
import { PRESET_DEMO_TRACKS, generateDemoAudioBuffer } from './services/demoTracks';
import { AudioTrack, EQPreset, SpatialSettings, AudioEngineMetrics } from './types/audio';

export const App: React.FC = () => {
  const [tracks, setTracks] = useState<AudioTrack[]>(PRESET_DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(PRESET_DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(PRESET_DEMO_TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isBitPerfect, setIsBitPerfect] = useState<boolean>(false);
  const [isAbCompareOriginal, setIsAbCompareOriginal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'player' | 'spatial' | 'eq' | 'visualizer'>('player');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [remoteUrl, setRemoteUrl] = useState<string>(() => {
    return localStorage.getItem('aura_github_remote_url') || 'https://github.com/sagniksarkar/lossless-hifi-player.git';
  });

  const [spatialSettings, setSpatialSettings] = useState<SpatialSettings>(audioEngine.getSpatialSettings());
  const [currentPreset, setCurrentPreset] = useState<EQPreset>(audioEngine.getCurrentPreset());
  const [metrics, setMetrics] = useState<AudioEngineMetrics>(audioEngine.getMetrics());

  // Load track buffer into audio engine
  const loadTrack = useCallback(async (track: AudioTrack, autoPlay: boolean = true) => {
    try {
      let buffer = track.audioBuffer;

      // If procedural demo track, generate audio buffer
      if (!buffer) {
        const audioCtx = audioEngine.getAudioContext();
        if (track.id === 'demo-atmos-1') {
          buffer = generateDemoAudioBuffer(audioCtx, 'atmos');
        } else if (track.id === 'demo-audiophile-2') {
          buffer = generateDemoAudioBuffer(audioCtx, 'audiophile');
        } else if (track.id === 'demo-electronic-3') {
          buffer = generateDemoAudioBuffer(audioCtx, 'electronic');
        }
        track.audioBuffer = buffer;
      }

      if (buffer) {
        await audioEngine.loadAudioBuffer(buffer);
        setCurrentTrack(track);
        setDuration(buffer.duration);
        setCurrentTime(0);
        setMetrics(audioEngine.getMetrics());

        if (autoPlay) {
          audioEngine.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Error loading audio track buffer:', err);
    }
  }, []);

  // Track playback handlers
  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (!currentTrack && tracks.length > 0) {
        loadTrack(tracks[0], true);
      } else {
        audioEngine.play();
        setIsPlaying(true);
      }
    }
    setMetrics(audioEngine.getMetrics());
  };

  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else if (currentTrack) {
      const curIdx = tracks.findIndex(t => t.id === currentTrack.id);
      nextIndex = (curIdx + 1) % tracks.length;
    }
    loadTrack(tracks[nextIndex], true);
  }, [tracks, currentTrack, isShuffle, loadTrack]);

  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    let prevIndex = tracks.length - 1;
    if (currentTrack) {
      const curIdx = tracks.findIndex(t => t.id === currentTrack.id);
      prevIndex = (curIdx - 1 + tracks.length) % tracks.length;
    }
    loadTrack(tracks[prevIndex], true);
  }, [tracks, currentTrack, currentTime, loadTrack]);

  // Audio Engine Event Subscriptions
  useEffect(() => {
    audioEngine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      if (dur > 0) setDuration(dur);
    });

    audioEngine.onEnded(() => {
      handleNextTrack();
    });

    // Load initial track buffer
    if (currentTrack) {
      loadTrack(currentTrack, false);
    }
  }, [handleNextTrack, loadTrack]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        audioEngine.seek(currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audioEngine.seek(currentTime - 5);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, volume + 0.05);
        setVolume(newVol);
        audioEngine.setVolume(newVol);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, volume - 0.05);
        setVolume(newVol);
        audioEngine.setVolume(newVol);
      } else if (e.code === 'KeyM') {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audioEngine.setMute(newMuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, volume, isMuted, currentTrack]);

  // Spatial & EQ Handlers
  const handleUpdateSpatial = (newSettings: Partial<SpatialSettings>) => {
    audioEngine.setSpatialSettings(newSettings);
    setSpatialSettings(audioEngine.getSpatialSettings());
  };

  const handleSelectEQPreset = (preset: EQPreset) => {
    audioEngine.setEQPreset(preset);
    setCurrentPreset(preset);
  };

  const handleUpdateBand = (bandIdx: number, gain: number) => {
    audioEngine.setBandGain(bandIdx, gain);
    setCurrentPreset(audioEngine.getCurrentPreset());
  };

  const handleUpdatePreamp = (dB: number) => {
    audioEngine.setPreampGain(dB);
    setCurrentPreset(audioEngine.getCurrentPreset());
  };

  const handleResetFlat = () => {
    handleSelectEQPreset(PREBUILT_EQ_PRESETS[0]);
  };

  const handleToggleBitPerfect = () => {
    const nextVal = !isBitPerfect;
    setIsBitPerfect(nextVal);
    audioEngine.setBitPerfectBypass(nextVal);
    setMetrics(audioEngine.getMetrics());
  };

  const handleToggleAbCompare = () => {
    const nextVal = audioEngine.toggleAbCompare();
    setIsAbCompareOriginal(nextVal);
  };

  const handleAddTracks = (newTracks: AudioTrack[]) => {
    setTracks(prev => [...prev, ...newTracks]);
    if (!currentTrack && newTracks.length > 0) {
      loadTrack(newTracks[0], true);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      const remaining = tracks.filter(t => t.id !== trackId);
      if (remaining.length > 0) {
        loadTrack(remaining[0], isPlaying);
      } else {
        audioEngine.stop();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  };

  const handleClearPlaylist = () => {
    audioEngine.stop();
    setTracks([]);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleRestoreDemos = () => {
    setTracks(PRESET_DEMO_TRACKS);
    if (!currentTrack) {
      loadTrack(PRESET_DEMO_TRACKS[0], true);
    }
  };

  const handleSaveRemoteUrl = (url: string) => {
    setRemoteUrl(url);
    localStorage.setItem('aura_github_remote_url', url);
  };

  return (
    <div className="min-h-screen bg-audiophile-950 text-slate-100 flex flex-col pb-36">
      {/* Top Audiophile Header */}
      <Header
        metrics={metrics}
        isBitPerfect={isBitPerfect}
        onToggleBitPerfect={handleToggleBitPerfect}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDolbyAtmosActive={spatialSettings.enabled && spatialSettings.mode !== 'stereo'}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'player' && (
          <div className="space-y-6">
            <PlaylistQueue
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectTrack={(t) => loadTrack(t, true)}
              onAddTracks={handleAddTracks}
              onRemoveTrack={handleRemoveTrack}
              onClearPlaylist={handleClearPlaylist}
              onRestoreDemos={handleRestoreDemos}
            />
          </div>
        )}

        {activeTab === 'spatial' && (
          <SpatialAtmosPanel
            settings={spatialSettings}
            onUpdateSettings={handleUpdateSpatial}
            isPlaying={isPlaying}
          />
        )}

        {activeTab === 'eq' && (
          <EqualizerPanel
            currentPreset={currentPreset}
            onSelectPreset={handleSelectEQPreset}
            onUpdateBand={handleUpdateBand}
            onUpdatePreamp={handleUpdatePreamp}
            onResetFlat={handleResetFlat}
          />
        )}

        {activeTab === 'visualizer' && (
          <VisualizerPanel
            isPlaying={isPlaying}
            trackTitle={currentTrack?.title}
            isDolbyAtmos={spatialSettings.enabled && spatialSettings.mode !== 'stereo'}
          />
        )}
      </main>

      {/* Floating Bottom Master Player Controls */}
      <PlayerControls
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLoop={isLoop}
        isShuffle={isShuffle}
        isAbCompareOriginal={isAbCompareOriginal}
        onPlayPause={handlePlayPause}
        onSeek={(t) => audioEngine.seek(t)}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onVolumeChange={(v) => {
          setVolume(v);
          audioEngine.setVolume(v);
        }}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          audioEngine.setMute(next);
        }}
        onToggleLoop={() => {
          const next = !isLoop;
          setIsLoop(next);
          audioEngine.setLoop(next);
        }}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleAbCompare={handleToggleAbCompare}
      />

      {/* GitHub Repository Sync Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        remoteUrl={remoteUrl}
        onSaveRemoteUrl={handleSaveRemoteUrl}
      />
    </div>
  );
};
