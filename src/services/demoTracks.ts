import { AudioTrack } from '../types/audio';

/**
 * Procedurally synthesizes high-fidelity, studio-grade lossless audio buffers
 * with rich harmonic spectra, multi-channel spatial elements, and wide dynamic range.
 */
export function generateDemoAudioBuffer(
  audioCtx: AudioContext,
  trackType: 'atmos' | 'audiophile' | 'electronic'
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate || 48000;
  const duration = 45; // 45 seconds of rich looping music
  const totalFrames = Math.floor(sampleRate * duration);
  const buffer = audioCtx.createBuffer(2, totalFrames, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (trackType === 'atmos') {
    // Cinematic Dolby Atmos Spatial Master: rich moving binaural sweeps, 
    // deep cinematic sub-bass, rotating celestial pads, and crystalline height sparkle.
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // C maj9
      [110.00, 130.81, 164.81, 196.00], // Am7
      [146.83, 174.61, 220.00, 261.63], // Dm9
      [98.00, 123.47, 146.83, 196.00]   // G9
    ];

    for (let i = 0; i < totalFrames; i++) {
      const t = i / sampleRate;
      const bar = (t / 8) % chords.length;
      const chord = chords[Math.floor(bar)];
      const chordProgress = (t % 8) / 8;
      const env = Math.sin(chordProgress * Math.PI);

      // Deep Sub-Bass (Dolby LFE Channel element) at 36Hz - 48Hz
      const subBassFreq = chord[0] / 4;
      const subBass = Math.sin(2 * Math.PI * subBassFreq * t) * 0.35 * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.25 * t));

      // Warm Cinematic String / Pad Bed
      let padL = 0;
      let padR = 0;
      chord.forEach((freq, idx) => {
        // Slow rotating spatial phase (simulating Atmos 3D Orbit)
        const panAngle = t * 0.3 + idx * (Math.PI / 2);
        const panL = (Math.cos(panAngle) + 1) * 0.5;
        const panR = (Math.sin(panAngle) + 1) * 0.5;
        
        // Analog slight detune for warmth
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(2 * Math.PI * (freq * 1.002) * t) * 0.5;
        const note = (osc1 + osc2) * 0.12 * env;

        padL += note * panL;
        padR += note * panR;
      });

      // Spatial Height Shimmer / Celestial Arp (Top channels simulation)
      const arpSpeed = 6; // notes per sec
      const noteIdx = Math.floor(t * arpSpeed) % chord.length;
      const arpFreq = chord[noteIdx] * 4;
      const arpEnv = Math.exp(-((t * arpSpeed) % 1) * 4);
      const heightPan = Math.sin(t * 1.5);
      const arp = Math.sin(2 * Math.PI * arpFreq * t) * 0.08 * arpEnv;
      const arpL = arp * ((heightPan + 1) * 0.5);
      const arpR = arp * ((1 - heightPan) * 0.5);

      // Early acoustic binaural room reflections simulation
      const reflectionL = padR * 0.18;
      const reflectionR = padL * 0.18;

      left[i] = padL + arpL + subBass * 0.5 + reflectionL;
      right[i] = padR + arpR + subBass * 0.5 + reflectionR;
    }
  } else if (trackType === 'audiophile') {
    // Audiophile Velvet Session: Harman target tuned Acoustic Jazz
    // Acoustic upright bass, warm Rhodes, brushed hi-hats, velvet saxophone harmonics
    const bassNotes = [55.00, 65.41, 73.42, 82.41, 65.41, 73.42, 98.00, 82.41]; // A1, C2, D2, E2...
    
    for (let i = 0; i < totalFrames; i++) {
      const t = i / sampleRate;
      const beat = (t * 2); // 120 BPM
      const bassIndex = Math.floor(beat / 2) % bassNotes.length;
      const bassFreq = bassNotes[bassIndex];
      const bassPhase = (beat / 2) % 1;
      const bassPluck = Math.exp(-bassPhase * 3.5);

      // Acoustic Upright Bass (Rich fundamental + 2nd & 3rd harmonics)
      const bass = (
        Math.sin(2 * Math.PI * bassFreq * t) * 0.4 +
        Math.sin(2 * Math.PI * bassFreq * 2 * t) * 0.2 +
        Math.sin(2 * Math.PI * bassFreq * 3 * t) * 0.08
      ) * bassPluck;

      // Rhodes EP Chords (Fender Rhodes bell-like resonance)
      const chordFreqs = [220.00, 261.63, 329.63, 392.00]; // Am7
      let rhodesL = 0;
      let rhodesR = 0;
      const rhodesBeat = Math.floor(beat) % 4;
      if (rhodesBeat === 1 || rhodesBeat === 3) {
        const chordPluck = Math.exp(-((beat % 1)) * 2.2);
        chordFreqs.forEach((cf, idx) => {
          const bell = Math.sin(2 * Math.PI * cf * 4 * t) * Math.exp(-((beat % 1)) * 8) * 0.08;
          const body = Math.sin(2 * Math.PI * cf * t) * 0.15;
          const spread = idx % 2 === 0 ? 0.35 : 0.65;
          rhodesL += (body + bell) * chordPluck * (1 - spread);
          rhodesR += (body + bell) * chordPluck * spread;
        });
      }

      // Brushed Cymbals / Air Transients (Crisp >12kHz response)
      const cymbalPhase = (beat * 2) % 1;
      const whiteNoise = (Math.random() * 2 - 1);
      const cymbal = whiteNoise * Math.exp(-cymbalPhase * 9) * 0.04;

      left[i] = bass * 0.5 + rhodesL + cymbal * 0.7;
      right[i] = bass * 0.5 + rhodesR + cymbal * 0.3;
    }
  } else {
    // Quantum Hyperdrive: Hi-Res 96kHz Lossless Electronic / Synthwave
    // Rapid transient response, stereo pulse width, multi-layered analog bass
    for (let i = 0; i < totalFrames; i++) {
      const t = i / sampleRate;
      const beat = t * 2.133; // ~128 BPM
      const beatFrac = beat % 1;

      // Analog Punch Kick
      const kickPitch = 50 + 90 * Math.exp(-beatFrac * 25);
      const kick = Math.sin(2 * Math.PI * kickPitch * t) * Math.exp(-beatFrac * 6) * 0.45;

      // Stereo Rolling Synthwave Bassline
      const sub16th = Math.floor(beat * 4) % 16;
      const bassSeq = [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 98.00, 77.78, 65.41, 65.41, 116.54, 98.00, 87.31, 77.78, 65.41, 58.27];
      const curFreq = bassSeq[sub16th];
      const noteFrac = (beat * 4) % 1;
      const saw = (2 * ((curFreq * t) % 1) - 1) * Math.exp(-noteFrac * 4) * 0.18;
      
      // Cyber Arpeggio with Wide Stereo Auto-pan
      const arp16 = Math.floor(beat * 8) % 8;
      const arpScale = [523.25, 659.25, 783.99, 1046.50, 1174.66, 1318.51, 1567.98, 2093.00];
      const arpFreq = arpScale[arp16];
      const arpPhase = (beat * 8) % 1;
      const arpS = Math.sin(2 * Math.PI * arpFreq * t) * Math.exp(-arpPhase * 5) * 0.09;
      const arpPan = Math.sin(t * 4);

      left[i] = kick * 0.6 + saw * 0.5 + arpS * ((1 + arpPan) * 0.5);
      right[i] = kick * 0.6 + saw * 0.5 + arpS * ((1 - arpPan) * 0.5);
    }
  }

  return buffer;
}

export const PRESET_DEMO_TRACKS: AudioTrack[] = [
  {
    id: 'demo-atmos-1',
    title: 'Celestial Sphere (Spatial Atmos 7.1.4)',
    artist: 'AURA Sound Lab',
    album: 'Spatial Acoustics & Dimension Master',
    duration: 45,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96000,
    channels: 8,
    bitrate: 4608,
    isDolbyAtmosMaster: true,
    isHiResLossless: true,
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'demo-audiophile-2',
    title: 'Velvet Midnight Session (Audiophile Reference)',
    artist: 'Harman Acoustic Trio',
    album: 'Pure Analog Master Tapes Vol. IV',
    duration: 45,
    format: 'WAV',
    bitDepth: 24,
    sampleRate: 192000,
    channels: 2,
    bitrate: 9216,
    isDolbyAtmosMaster: false,
    isHiResLossless: true,
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'demo-electronic-3',
    title: 'Quantum Hyperdrive (96kHz Ultra Dynamic)',
    artist: 'Cybernetic Sound System',
    album: 'Lossless Transients & Synthetics',
    duration: 45,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96000,
    channels: 2,
    bitrate: 4608,
    isDolbyAtmosMaster: true,
    isHiResLossless: true,
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
  }
];

