import { EQPreset, SpatialSettings, AudioEngineMetrics, SpatialMode } from '../types/audio';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const PREBUILT_EQ_PRESETS: EQPreset[] = [
  {
    id: 'flat',
    name: 'Lossless Flat (Bypass)',
    description: 'Uncolored, true studio master response curve without digital alteration.',
    preamp: 0,
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: 'harman-audiophile',
    name: 'Audiophile Reference (Harman Target)',
    description: 'The golden audiophile acoustic standard: slight sub-bass shelf and gentle treble air.',
    preamp: -1.5,
    gains: [4.5, 3.5, 1.5, 0.5, -0.5, 0, 1.0, 2.0, 3.0, 2.5]
  },
  {
    id: 'dolby-cinema',
    name: 'Dolby Atmos Cinema Immersion',
    description: 'Dynamic impact curve with extended cinematic low-end and crisp dialogue presence.',
    preamp: -2.0,
    gains: [5.5, 4.0, 2.0, 0, 0.5, 1.5, 2.5, 3.5, 4.0, 3.0]
  },
  {
    id: 'sub-bass-punch',
    name: 'Sub-Bass & Club Impact',
    description: 'Deep 32Hz-64Hz rumble and punch without muddying midrange vocals.',
    preamp: -3.0,
    gains: [6.5, 5.0, 3.0, 1.0, 0, -0.5, 0.5, 1.0, 1.5, 0.5]
  },
  {
    id: 'vocal-intimate',
    name: 'Vocal & Acoustic Intimacy',
    description: 'Enhanced 1kHz-4kHz range for crystalline vocal clarity, acoustic guitars and strings.',
    preamp: -1.0,
    gains: [-1.0, -0.5, 0.5, 1.5, 2.5, 3.5, 3.0, 2.0, 1.0, 0.5]
  },
  {
    id: 'treble-air',
    name: 'Treble Air & Micro-Detail',
    description: 'Highlights high-frequency harmonics, cymbals, breath and acoustic room decays.',
    preamp: -1.5,
    gains: [-0.5, 0, 0, 0.5, 0.5, 1.0, 2.0, 4.0, 5.5, 6.0]
  },
  {
    id: 'classical-hall',
    name: 'Classical & Orchestral Hall',
    description: 'Expansive dynamic envelope with natural warmth and expansive instrument separation.',
    preamp: -1.0,
    gains: [2.5, 2.0, 1.0, 0.5, 0, 0.5, 1.5, 2.0, 3.0, 3.5]
  },
  {
    id: 'electronic-synth',
    name: 'Electronic & Synthwave Dynamic',
    description: 'V-shaped energetic curve for driving basslines, sharp hi-hats, and synth leads.',
    preamp: -2.5,
    gains: [5.0, 4.0, 1.5, -1.0, -1.5, 0.5, 2.0, 3.5, 4.5, 5.0]
  }
];

interface SpeakerVirtualNode {
  name: string;
  channel: 'L' | 'R' | 'C' | 'LFE' | 'SL' | 'SR' | 'RL' | 'RR' | 'TFL' | 'TFR' | 'TRL' | 'TRR';
  azimuth: number; // degrees (-180 to 180)
  elevation: number; // degrees (-90 to 90)
  panner: PannerNode;
  gain: GainNode;
  active: boolean;
}

class AudioEngineService {
  private audioCtx: AudioContext | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private isMediaElementMode: boolean = false;

  // Signal processing nodes
  private preampGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private softLimiter: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private stereoSplitter: ChannelSplitterNode | null = null;
  private stereoMerger: ChannelMergerNode | null = null;

  // Dolby Atmos 7.1.4 Surround Virtualizer Nodes
  private spatialInputGain: GainNode | null = null;
  private spatialOutputGain: GainNode | null = null;
  private directDryGain: GainNode | null = null;
  private speakers: SpeakerVirtualNode[] = [];
  private roomReverbNode: ConvolverNode | null = null;
  private reverbSendGain: GainNode | null = null;
  private lfeLowpassFilter: BiquadFilterNode | null = null;

  // Playback state
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private currentDuration: number = 0;
  private playbackRate: number = 1.0;
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private loop: boolean = false;
  private isBitPerfectBypass: boolean = false;
  private isAbCompareOriginal: boolean = false; // When true, listens to raw stereo original

  // Settings
  private currentPreset: EQPreset = PREBUILT_EQ_PRESETS[1]; // default Harman
  private spatialSettings: SpatialSettings = {
    mode: 'atmos_7_1_4',
    enabled: true,
    roomSize: 0.65,
    heightImmersion: 0.75,
    surroundSpread: 0.85,
    reverbDecay: 0.35,
    listenerAngle: 0,
    headTrackingSimulation: false,
    binauralHRTF: true,
    lfeBoost: 2.5,
    centerFocus: 0.7,
    crossfeedAmount: 0.35
  };

  // Listeners
  private onEndedCallback: (() => void) | null = null;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({
        latencyHint: 'interactive',
        sampleRate: undefined // Use hardware native DAC rate (up to 96k/192k)
      });
      this.initSignalChain();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private initSignalChain() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    // 1. Preamp
    this.preampGain = ctx.createGain();
    this.setPreampGain(this.currentPreset.preamp);

    // 2. 10-Band EQ filters
    this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = ctx.createBiquadFilter();
      if (idx === 0) {
        filter.type = 'lowshelf';
      } else if (idx === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.414; // audiophile constant-Q octave band
      }
      filter.frequency.value = freq;
      filter.gain.value = this.currentPreset.gains[idx] || 0;
      return filter;
    });

    // Chain EQ filters in series
    let lastFilterNode: AudioNode = this.preampGain;
    this.eqFilters.forEach(filter => {
      lastFilterNode.connect(filter);
      lastFilterNode = filter;
    });

    // 3. Dolby Atmos 7.1.4 Binaural Spatial Array
    this.initSpatialAtmosEngine(lastFilterNode);

    // 4. Soft Limiter (Audiophile Brickwall Limiter to avoid inter-sample peaks)
    this.softLimiter = ctx.createDynamicsCompressor();
    this.softLimiter.threshold.setValueAtTime(-0.5, ctx.currentTime);
    this.softLimiter.knee.setValueAtTime(3.0, ctx.currentTime);
    this.softLimiter.ratio.setValueAtTime(20.0, ctx.currentTime);
    this.softLimiter.attack.setValueAtTime(0.002, ctx.currentTime);
    this.softLimiter.release.setValueAtTime(0.05, ctx.currentTime);

    // 5. Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);

    // 6. Dual Analyser Nodes for high-res stereo vectorscope and FFT spectrum
    this.analyserLeft = ctx.createAnalyser();
    this.analyserLeft.fftSize = 2048;
    this.analyserLeft.smoothingTimeConstant = 0.82;

    this.analyserRight = ctx.createAnalyser();
    this.analyserRight.fftSize = 2048;
    this.analyserRight.smoothingTimeConstant = 0.82;

    this.stereoSplitter = ctx.createChannelSplitter(2);
    this.stereoMerger = ctx.createChannelMerger(2);

    // Limiter -> Master Gain -> Splitter -> Analysers -> Merger -> Destination
    if (this.spatialOutputGain) {
      this.spatialOutputGain.connect(this.softLimiter);
    }
    this.softLimiter.connect(this.masterGain);

    this.masterGain.connect(this.stereoSplitter);
    this.stereoSplitter.connect(this.analyserLeft, 0);
    this.stereoSplitter.connect(this.analyserRight, 1);

    this.analyserLeft.connect(this.stereoMerger, 0, 0);
    this.analyserRight.connect(this.stereoMerger, 0, 1);

    this.stereoMerger.connect(ctx.destination);
  }

  private initSpatialAtmosEngine(eqOutputNode: AudioNode) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    this.spatialInputGain = ctx.createGain();
    eqOutputNode.connect(this.spatialInputGain);

    this.spatialOutputGain = ctx.createGain();
    this.directDryGain = ctx.createGain();

    // 7.1.4 Speaker layout setup (Azimuth & Elevation in degrees)
    const speakerLayout: Array<{
      name: string;
      channel: SpeakerVirtualNode['channel'];
      azimuth: number;
      elevation: number;
    }> = [
      { name: 'Front Left', channel: 'L', azimuth: -30, elevation: 0 },
      { name: 'Center', channel: 'C', azimuth: 0, elevation: 0 },
      { name: 'Front Right', channel: 'R', azimuth: 30, elevation: 0 },
      { name: 'Low Frequency Effect', channel: 'LFE', azimuth: 0, elevation: -20 },
      { name: 'Side Surround Left', channel: 'SL', azimuth: -90, elevation: 5 },
      { name: 'Side Surround Right', channel: 'SR', azimuth: 90, elevation: 5 },
      { name: 'Rear Surround Left', channel: 'RL', azimuth: -135, elevation: 10 },
      { name: 'Rear Surround Right', channel: 'RR', azimuth: 135, elevation: 10 },
      { name: 'Top Front Left', channel: 'TFL', azimuth: -45, elevation: 45 },
      { name: 'Top Front Right', channel: 'TFR', azimuth: 45, elevation: 45 },
      { name: 'Top Rear Left', channel: 'TRL', azimuth: -135, elevation: 45 },
      { name: 'Top Rear Right', channel: 'TRR', azimuth: 135, elevation: 45 }
    ];

    // Create LFE Subwoofer dedicated lowpass filter
    this.lfeLowpassFilter = ctx.createBiquadFilter();
    this.lfeLowpassFilter.type = 'lowpass';
    this.lfeLowpassFilter.frequency.value = 100;
    this.lfeLowpassFilter.Q.value = 1.0;

    // Room Reverb Impulse Node
    this.roomReverbNode = ctx.createConvolver();
    this.generateSyntheticImpulseResponse();

    this.reverbSendGain = ctx.createGain();
    this.reverbSendGain.gain.value = this.spatialSettings.reverbDecay * 0.35;
    this.roomReverbNode.connect(this.spatialOutputGain);

    this.speakers = speakerLayout.map(item => {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.0;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;

      const gain = ctx.createGain();

      // Connect panner to speaker gain, then to spatial output
      panner.connect(gain);
      gain.connect(this.spatialOutputGain!);

      return {
        name: item.name,
        channel: item.channel,
        azimuth: item.azimuth,
        elevation: item.elevation,
        panner,
        gain,
        active: true
      };
    });

    this.updateSpeakerPositions();
    this.routeInputToSpeakers();
  }

  private generateSyntheticImpulseResponse() {
    if (!this.audioCtx || !this.roomReverbNode) return;
    const sampleRate = this.audioCtx.sampleRate;
    const decayDuration = 1.8;
    const numSamples = Math.floor(sampleRate * decayDuration);
    const impulse = this.audioCtx.createBuffer(2, numSamples, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < numSamples; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.45));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    this.roomReverbNode.buffer = impulse;
  }

  private updateSpeakerPositions() {
    if (!this.audioCtx) return;
    const spread = this.spatialSettings.surroundSpread;
    const heightFactor = this.spatialSettings.heightImmersion;
    const angleOffset = (this.spatialSettings.listenerAngle * Math.PI) / 180;

    this.speakers.forEach(spk => {
      // Calculate adjusted azimuth and elevation based on user sliders
      let az = spk.azimuth * spread;
      let el = spk.elevation * heightFactor;

      // Convert spherical to Cartesian coordinate space (x, y, z)
      const radAz = (az * Math.PI) / 180 + angleOffset;
      const radEl = (el * Math.PI) / 180;
      const distance = 2.0;

      const x = distance * Math.cos(radEl) * Math.sin(radAz);
      const y = distance * Math.sin(radEl);
      const z = -distance * Math.cos(radEl) * Math.cos(radAz);

      if (spk.panner.positionX) {
        spk.panner.positionX.setValueAtTime(x, this.audioCtx!.currentTime);
        spk.panner.positionY.setValueAtTime(y, this.audioCtx!.currentTime);
        spk.panner.positionZ.setValueAtTime(z, this.audioCtx!.currentTime);
      } else {
        // Fallback for older Web Audio API
        spk.panner.setPosition(x, y, z);
      }

      // Channel specific gain weighting
      let baseGain = 0.7;
      if (spk.channel === 'LFE') {
        baseGain = Math.pow(10, this.spatialSettings.lfeBoost / 20) * 0.8;
      } else if (spk.channel === 'C') {
        baseGain = this.spatialSettings.centerFocus;
      } else if (['TFL', 'TFR', 'TRL', 'TRR'].includes(spk.channel)) {
        baseGain = 0.6 * heightFactor;
      }
      spk.gain.gain.setValueAtTime(baseGain, this.audioCtx!.currentTime);
    });
  }

  private routeInputToSpeakers() {
    if (!this.spatialInputGain || !this.audioCtx) return;

    this.speakers.forEach(spk => {
      if (spk.channel === 'LFE' && this.lfeLowpassFilter) {
        this.spatialInputGain!.connect(this.lfeLowpassFilter);
        this.lfeLowpassFilter.connect(spk.panner);
      } else {
        this.spatialInputGain!.connect(spk.panner);
      }
    });

    if (this.roomReverbNode && this.reverbSendGain) {
      this.spatialInputGain.connect(this.reverbSendGain);
      this.reverbSendGain.connect(this.roomReverbNode);
    }
  }

  public setSpatialSettings(settings: Partial<SpatialSettings>) {
    this.spatialSettings = { ...this.spatialSettings, ...settings };
    if (!this.audioCtx) return;

    // Apply mode updates
    if (this.spatialSettings.mode === 'stereo' || !this.spatialSettings.enabled) {
      // Pure stereo bypass
      if (this.spatialOutputGain && this.directDryGain) {
        this.spatialOutputGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
        this.directDryGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      }
    } else {
      if (this.spatialOutputGain && this.directDryGain) {
        this.spatialOutputGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
        this.directDryGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
      }
      this.updateSpeakerPositions();
      if (this.reverbSendGain) {
        this.reverbSendGain.gain.setValueAtTime(this.spatialSettings.reverbDecay * 0.4, this.audioCtx.currentTime);
      }
    }
  }

  public getSpatialSettings(): SpatialSettings {
    return { ...this.spatialSettings };
  }

  public getSpeakerNodes(): SpeakerVirtualNode[] {
    return this.speakers;
  }

  public setEQPreset(preset: EQPreset) {
    this.currentPreset = preset;
    this.setPreampGain(preset.preamp);
    if (!this.audioCtx) return;

    preset.gains.forEach((gainVal, idx) => {
      if (this.eqFilters[idx]) {
        this.eqFilters[idx].gain.setValueAtTime(gainVal, this.audioCtx!.currentTime);
      }
    });
  }

  public setPresetById(presetId: string): EQPreset | null {
    const found = PREBUILT_EQ_PRESETS.find(p => p.id === presetId);
    if (found) {
      this.setEQPreset(found);
      return found;
    }
    return null;
  }

  public setBandGain(bandIndex: number, gain: number) {
    if (!this.currentPreset.gains) return;
    const newGains = [...this.currentPreset.gains];
    newGains[bandIndex] = gain;
    this.currentPreset = {
      ...this.currentPreset,
      id: 'custom-' + Date.now(),
      name: 'Custom Profile',
      gains: newGains,
      isCustom: true
    };
    if (this.audioCtx && this.eqFilters[bandIndex]) {
      this.eqFilters[bandIndex].gain.setValueAtTime(gain, this.audioCtx.currentTime);
    }
  }

  public setPreampGain(dB: number) {
    this.currentPreset.preamp = dB;
    if (this.preampGain && this.audioCtx) {
      const linearGain = Math.pow(10, dB / 20);
      this.preampGain.gain.setValueAtTime(linearGain, this.audioCtx.currentTime);
    }
  }

  public getCurrentPreset(): EQPreset {
    return this.currentPreset;
  }

  public setBitPerfectBypass(bypass: boolean) {
    this.isBitPerfectBypass = bypass;
    if (!this.audioCtx || !this.preampGain) return;

    if (bypass) {
      // Set all EQ bands to 0 and preamp to 0
      this.eqFilters.forEach(f => f.gain.setValueAtTime(0, this.audioCtx!.currentTime));
      this.preampGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      if (this.spatialOutputGain && this.directDryGain) {
        this.spatialOutputGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.directDryGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      }
    } else {
      this.setEQPreset(this.currentPreset);
      this.setSpatialSettings(this.spatialSettings);
    }
  }

  public toggleAbCompare(): boolean {
    this.isAbCompareOriginal = !this.isAbCompareOriginal;
    this.setBitPerfectBypass(this.isAbCompareOriginal);
    return this.isAbCompareOriginal;
  }

  public getIsAbCompareOriginal(): boolean {
    return this.isAbCompareOriginal;
  }

  public async loadAudioBuffer(buffer: AudioBuffer): Promise<void> {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.isMediaElementMode = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.currentBuffer = buffer;
    this.currentDuration = buffer.duration;
    this.pausedAt = 0;

    if (wasPlaying) {
      this.play();
    }
  }

  public async loadAudioUrl(url: string, duration?: number): Promise<void> {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.isMediaElementMode = true;
    this.currentBuffer = null;
    this.currentDuration = duration || 180;
    this.pausedAt = 0;

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.mediaElementSource = ctx.createMediaElementSource(this.audioElement);
      if (this.preampGain) {
        this.mediaElementSource.connect(this.preampGain);
      }
      if (this.directDryGain && this.softLimiter) {
        this.mediaElementSource.connect(this.directDryGain);
      }
      this.audioElement.onended = () => {
        this.isPlaying = false;
        this.pausedAt = 0;
        this.cancelTimeUpdater();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      };
      this.audioElement.onloadedmetadata = () => {
        if (this.audioElement && this.audioElement.duration && isFinite(this.audioElement.duration)) {
          this.currentDuration = this.audioElement.duration;
          if (this.onTimeUpdateCallback) {
            this.onTimeUpdateCallback(this.audioElement.currentTime, this.currentDuration);
          }
        }
      };
      this.audioElement.ontimeupdate = () => {
        if (this.audioElement && this.onTimeUpdateCallback && this.isMediaElementMode) {
          if (this.audioElement.duration && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration)) {
            this.currentDuration = this.audioElement.duration;
          }
          this.onTimeUpdateCallback(this.audioElement.currentTime, this.currentDuration);
        }
      };
      this.audioElement.onerror = (e) => {
        console.warn("Audio element streaming error:", e, this.audioElement?.error);
      };
    }

    this.audioElement.src = url;
    this.audioElement.load();

    if (wasPlaying) {
      this.play();
    }
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  public play() {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (this.isMediaElementMode && this.audioElement) {
      this.audioElement.play().catch(e => console.warn("Audio stream playback:", e));
      this.isPlaying = true;
      return;
    }

    if (!this.currentBuffer) return;

    if (this.isPlaying) return;

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    this.sourceNode.playbackRate.value = this.playbackRate;
    this.sourceNode.loop = this.loop;

    // Connect source to Preamp and direct dry gain
    if (this.preampGain) {
      this.sourceNode.connect(this.preampGain);
    }
    if (this.directDryGain && this.softLimiter) {
      this.sourceNode.connect(this.directDryGain);
      this.directDryGain.connect(this.softLimiter);
    }

    this.sourceNode.onended = () => {
      if (this.isPlaying && !this.loop) {
        this.isPlaying = false;
        this.pausedAt = 0;
        this.cancelTimeUpdater();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    const offset = this.pausedAt % this.currentDuration;
    this.sourceNode.start(0, offset);
    this.startTime = ctx.currentTime - offset;
    this.isPlaying = true;

    this.startTimeUpdater();
  }

  public pause() {
    if (this.isMediaElementMode && this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      return;
    }

    if (!this.isPlaying || !this.audioCtx) return;
    this.pausedAt = this.audioCtx.currentTime - this.startTime;
    this.isPlaying = false;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // already stopped
      }
      this.sourceNode = null;
    }
    this.cancelTimeUpdater();
  }

  public stop() {
    this.pause();
    this.pausedAt = 0;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, this.currentDuration);
    }
  }

  public seek(seconds: number) {
    if (this.isMediaElementMode && this.audioElement) {
      const target = Math.max(0, Math.min(seconds, this.currentDuration));
      this.audioElement.currentTime = target;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(target, this.currentDuration);
      }
      return;
    }

    const target = Math.max(0, Math.min(seconds, this.currentDuration));
    const wasPlaying = this.isPlaying;
    this.pause();
    this.pausedAt = target;
    if (wasPlaying) {
      this.play();
    } else {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(target, this.currentDuration);
      }
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(val, 1));
    if (this.masterGain && this.audioCtx) {
      const effectiveVol = this.isMuted ? 0 : Math.pow(this.volume, 2); // logarithmic volume taper
      this.masterGain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    this.setVolume(this.volume);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setLoop(loop: boolean) {
    this.loop = loop;
    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
    if (this.audioElement) {
      this.audioElement.loop = loop;
    }
  }

  public getIsLoop(): boolean {
    return this.loop;
  }

  public getCurrentTime(): number {
    if (this.isMediaElementMode && this.audioElement) {
      return this.audioElement.currentTime || 0;
    }
    if (!this.audioCtx) return this.pausedAt;
    if (this.isPlaying) {
      const elapsed = (this.audioCtx.currentTime - this.startTime) % this.currentDuration;
      return Math.max(0, elapsed);
    }
    return this.pausedAt;
  }

  public getDuration(): number {
    return this.currentDuration;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getAnalysers(): { left: AnalyserNode | null; right: AnalyserNode | null } {
    return {
      left: this.analyserLeft,
      right: this.analyserRight
    };
  }

  public getMetrics(): AudioEngineMetrics {
    const ctx = this.audioCtx;
    return {
      contextSampleRate: ctx ? ctx.sampleRate : 48000,
      baseLatency: ctx ? ctx.baseLatency || 0.005 : 0.005,
      outputLatency: ctx && 'outputLatency' in ctx ? (ctx as any).outputLatency || 0.012 : 0.012,
      channelCount: ctx ? ctx.destination.maxChannelCount || 2 : 2,
      state: ctx ? ctx.state : 'suspended',
      isBitPerfectBypass: this.isBitPerfectBypass,
    };
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  private startTimeUpdater() {
    this.cancelTimeUpdater();
    let lastTimeUpdate = 0;
    const update = (timestamp: number) => {
      if (this.isPlaying && this.onTimeUpdateCallback) {
        // Throttle updates to ~4 times per second (250ms) to prevent re-rendering the entire React DOM tree 144 times/sec
        if (timestamp - lastTimeUpdate >= 250) {
          this.onTimeUpdateCallback(this.getCurrentTime(), this.currentDuration);
          lastTimeUpdate = timestamp;
        }
      }
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private cancelTimeUpdater() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const audioEngine = new AudioEngineService();

