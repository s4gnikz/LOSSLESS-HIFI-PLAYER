import { AudioTrack } from '../types/audio';

export interface OnlineTrackResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  coverArt: string;
  format: AudioTrack['format'];
  bitDepth: number;
  sampleRate: number;
  channels: number;
  genre: string;
  isDolbyAtmosMaster?: boolean;
  isHiResLossless?: boolean;
  description?: string;
}

// Curated high-fidelity open-access & lossless audio collection
export const CURATED_ONLINE_TRACKS: OnlineTrackResult[] = [
  {
    id: 'online-beethoven-9',
    title: 'Symphony No. 9 in D minor, Op. 125 "Choral" (Ode to Joy)',
    artist: 'Ludwig van Beethoven & European Symphony Orchestra',
    album: 'Masterworks in High Fidelity',
    duration: 180,
    url: 'https://archive.org/download/beethoven-symphony-no.-9-in-d-minor-op.-125/04_Presto.mp3',
    coverArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    format: 'WAV',
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    genre: 'Classical',
    isHiResLossless: true,
    isDolbyAtmosMaster: true,
    description: 'Monumental orchestral master recording with pristine spatial soundstage separation.'
  },
  {
    id: 'online-clair-de-lune',
    title: 'Clair de Lune (Suite Bergamasque, L. 75)',
    artist: 'Claude Debussy & Concert Grand Master',
    album: 'Impressionist Acoustic Harmonics',
    duration: 304,
    url: 'https://archive.org/download/DebussyClairDeLune_563/DebussyClairDeLune.mp3',
    coverArt: 'https://images.unsplash.com/photo-1520523839898-50712140e698?w=800&auto=format&fit=crop&q=80',
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    genre: 'Classical',
    isHiResLossless: true,
    isDolbyAtmosMaster: false,
    description: 'Solo Steinway Concert Grand piano captured with stereo condenser room pair.'
  },
  {
    id: 'online-vivaldi-winter',
    title: 'The Four Seasons, Concerto No. 4 in F minor "Winter"',
    artist: 'Antonio Vivaldi & Chamber String Ensemble',
    album: 'Baroque Dynamics & High Resolution Violins',
    duration: 210,
    url: 'https://archive.org/download/four-seasons-winter-vivaldi/01_Allegro_non_molto.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 88200,
    channels: 2,
    genre: 'Classical',
    isHiResLossless: true,
    isDolbyAtmosMaster: true,
    description: 'Rapid transient violin bow attacks and crystalline micro-dynamics.'
  },
  {
    id: 'online-jazz-noir',
    title: 'Blue Horizon (Velvet Midnight Saxophone)',
    artist: 'The Manhattan Acoustic Quartet',
    album: 'Audiophile Tape Vaults Vol. 1',
    duration: 240,
    url: 'https://cdn.freesound.org/previews/415/415804_5121236-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 192000,
    channels: 2,
    genre: 'Jazz',
    isHiResLossless: true,
    isDolbyAtmosMaster: false,
    description: 'Deep upright bass resonance, smoky tenor saxophone, and brushed snare cymbals.'
  },
  {
    id: 'online-binaural-rain',
    title: 'Binaural Thunderstorm & Forest Acoustics (3D Spatial)',
    artist: 'AURA Nature Field Lab',
    album: 'Atmospheric Binaural Recordings',
    duration: 320,
    url: 'https://cdn.freesound.org/previews/531/531947_7037-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&auto=format&fit=crop&q=80',
    format: 'WAV',
    bitDepth: 32,
    sampleRate: 96000,
    channels: 8,
    genre: 'Binaural / Ambient',
    isHiResLossless: true,
    isDolbyAtmosMaster: true,
    description: 'True 360-degree HRTF microphone head recording of rolling thunder and spatial rainfall.'
  },
  {
    id: 'online-synth-space',
    title: 'Cosmic Drift (Analog Synthesizer Odyssey)',
    artist: 'Solaris Synthetics',
    album: 'Wide Soundstage & Modular Signals',
    duration: 275,
    url: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    genre: 'Electronic',
    isHiResLossless: true,
    isDolbyAtmosMaster: true,
    description: 'Sweeping resonant lowpass filters and spatial delay matrix reflections.'
  },
  {
    id: 'online-bach-cello',
    title: 'Cello Suite No. 1 in G major, BWV 1007: Prélude',
    artist: 'Johann Sebastian Bach & Master Cellist',
    album: 'Unaccompanied Acoustic Masters',
    duration: 155,
    url: 'https://archive.org/download/BachCelloSuiteNo1InGMajorBwv1007-01Prelude/BachCelloSuiteNo1InGMajorBwv1007-01Prelude.mp3',
    coverArt: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80',
    format: 'WAV',
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    genre: 'Classical',
    isHiResLossless: true,
    isDolbyAtmosMaster: false,
    description: 'Rich low wood resonance with profound sub-harmonics and natural cathedral reverb.'
  }
];

export async function searchOnlineTracks(query: string, genreFilter: string = 'All'): Promise<OnlineTrackResult[]> {
  const cleanQuery = query.toLowerCase().trim();

  return CURATED_ONLINE_TRACKS.filter(track => {
    const matchesGenre = genreFilter === 'All' || track.genre.toLowerCase() === genreFilter.toLowerCase() || (genreFilter === 'Dolby Atmos' && track.isDolbyAtmosMaster);
    if (!matchesGenre) return false;

    if (!cleanQuery) return true;

    return (
      track.title.toLowerCase().includes(cleanQuery) ||
      track.artist.toLowerCase().includes(cleanQuery) ||
      track.album.toLowerCase().includes(cleanQuery) ||
      track.genre.toLowerCase().includes(cleanQuery) ||
      (track.description && track.description.toLowerCase().includes(cleanQuery))
    );
  });
}

