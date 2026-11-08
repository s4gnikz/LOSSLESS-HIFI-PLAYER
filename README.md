# 🎵 AURA Hi-Fi — Lossless Audiophile Player & Dolby Atmos Spatial Engine

A web-based, **100% ad-free**, audiophile-grade lossless music player built with the Web Audio API, featuring **Dolby Atmos 7.1.4 3D spatial audio virtualizer**, **10-band constant-Q graphic equalizer**, **prebuilt audiophile reference curves & custom preset saving**, and **real-time audio telemetry visualizers**.

---

## ✨ Features

### 🎧 1. Hi-Fi Lossless Audio Engine
- **Native Lossless Audio**: Bit-perfect decoding of **FLAC**, **WAV**, **AIFF**, **ALAC**, **OGG**, and **MP3** files up to **192kHz / 24-bit and 32-bit float**.
- **Bit-Perfect Bypass Mode**: Direct bit-for-bit master stream to your external DAC/soundcard, bypassing digital equalizers for purist audiophile listening.
- **Dynamic Headroom & Soft-Knee Limiter**: True-peak brickwall protection prevents inter-sample clipping when aggressive EQ or multi-channel summing is applied.
- **Fast In-Browser Metadata Parser**: Automatically extracts FLAC `STREAMINFO`, Vorbis comments, embedded album art, sample rate, bit depth, and channel count.
- **A/B Instant Listening Comparison**: One-click instantaneous switch between Dolby Atmos 3D Spatial + EQ vs. Original Flat Stereo Master to hear soundstage depth immediately.

### 🌌 2. Dolby Atmos 7.1.4 & 3D Spatial Audio Virtualizer
- **Virtual 12-Channel HRTF Speaker Array**:
  - **Front Left / Front Right** (±30° azimuth, 0° elevation)
  - **Center** (0° azimuth, 0° elevation with dialogue focus control)
  - **LFE Subwoofer** (lowpass crossover filter at 100Hz with dedicated boost slider)
  - **Side Surrounds Left / Right** (±90° azimuth)
  - **Rear Surrounds Left / Right** (±135° azimuth)
  - **Top Heights (4 Channels)**: Top Front L/R and Top Rear L/R (+45° elevation overhead immersion)
- **Interactive 3D Soundstage**: 3D orbit canvas showing listener head orientation, speaker spheres, and live audio ray ripples. Drag to rotate the soundstage in 3D space.
- **Spatial Modes**:
  - `Dolby Atmos 7.1.4`: Full 12-speaker discrete binaural object matrix.
  - `Binaural Studio`: Near-field studio monitoring for audiophile headphones.
  - `Spatial 3D Wide`: Expansive stereo widening with crosstalk cancellation.
  - `Concert Hall Immersion`: Convolver acoustic impulse response for natural reverberant spaces.
  - `Stereo Pure`: Clean 2-channel direct output.

### 🎚️ 3. 10-Band Graphic Equalizer with Spline Response Curve
- **Frequencies**: 32Hz (Sub-Bass), 64Hz (Bass), 125Hz (Low-Mid), 250Hz (Warmth), 500Hz (Body), 1kHz (Midrange), 2kHz (Clarity), 4kHz (Presence), 8kHz (Treble), 16kHz (Air).
- **Preamp Gain**: -12 dB to +12 dB with clipping headroom protection.
- **Real-Time Spline Curve Canvas**: Visualizes the interpolated frequency response curve (20Hz - 20kHz) with logarithmic grid lines.
- **Prebuilt Audiophile Target Presets**:
  - *Audiophile Reference (Harman Target Curve)*
  - *Dolby Atmos Cinema Immersion*
  - *Lossless Flat (Bypass)*
  - *Sub-Bass & Club Impact*
  - *Vocal & Acoustic Intimacy*
  - *Treble Air & Micro-Detail*
  - *Classical & Orchestral Hall*
  - *Electronic & Synthwave Dynamic*
- **Custom Presets**: Create, name, and save your custom frequency profiles directly to browser storage.

### 📊 4. Real-Time Telemetry & Visualizers
- **128-Band FFT Spectrum Analyzer**: Smooth logarithmic spectrum with peak-hold decay caps.
- **Stereo Lissajous Phase Vectorscope**: Plots Mid/Side stereo width and calculates phase correlation (+1.0 to -1.0) to inspect Dolby Atmos 3D diffusion and mono compatibility.
- **Dual True-Peak dBFS & RMS Meters**: Calibrated from -60 dB to 0 dBFS with overload clipping warning indicators.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>Space</kbd> | Play / Pause |
| <kbd>→</kbd> / <kbd>←</kbd> | Seek forward / backward 5 seconds |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Adjust volume up / down |
| <kbd>M</kbd> | Toggle Mute |
| Double-click Fader | Reset band gain to 0 dB |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build
```

---

## 🐙 Push to GitHub

To push this repository to your GitHub account:

```bash
# Set your remote repository
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git

# Push main branch
git branch -M main
git push -u origin main
```
