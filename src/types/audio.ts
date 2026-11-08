export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url?: string;
  blob?: Blob;
  audioBuffer?: AudioBuffer;
  coverArt?: string;
  format: 'FLAC' | 'WAV' | 'ALAC' | 'AIFF' | 'DSD' | 'MP3' | 'AAC' | 'OGG';
  bitDepth: number; // e.g. 24, 16, 32
  sampleRate: number; // e.g. 44100, 48000, 96000, 192000
  channels: number; // 2, 6, 8, etc.
  bitrate?: number; // in kbps
  isDolbyAtmosMaster?: boolean;
  isHiResLossless?: boolean;
}

export interface EQPreset {
  id: string;
  name: string;
  description: string;
  preamp: number; // dB (-12 to +12)
  gains: number[]; // 10 bands (-12 to +12 dB)
  isCustom?: boolean;
}

export type SpatialMode = 'stereo' | 'atmos_7_1_4' | 'binaural_studio' | 'spatial_wide' | 'concert_hall';

export interface SpatialSettings {
  mode: SpatialMode;
  enabled: boolean;
  roomSize: number; // 0 to 1
  heightImmersion: number; // 0 to 1 (elevation gain)
  surroundSpread: number; // 0 to 1 (azimuth width)
  reverbDecay: number; // 0 to 1
  listenerAngle: number; // -180 to +180 degrees
  headTrackingSimulation: boolean;
  binauralHRTF: boolean;
  lfeBoost: number; // -6 to +10 dB
  centerFocus: number; // 0 to 1
}

export interface AudioEngineMetrics {
  contextSampleRate: number;
  baseLatency: number;
  outputLatency: number;
  channelCount: number;
  state: AudioContextState;
  isBitPerfectBypass: boolean;
}

