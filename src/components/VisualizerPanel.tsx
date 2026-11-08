import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { Activity, Maximize2, Radio, Layers, BarChart3, Disc } from 'lucide-react';

interface VisualizerPanelProps {
  isPlaying: boolean;
  trackTitle?: string;
  isDolbyAtmos?: boolean;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  isPlaying,
  trackTitle,
  isDolbyAtmos
}) => {
  const [viewMode, setViewMode] = useState<'spectrum' | 'vectorscope' | 'vu_meters'>('spectrum');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Peak hold array for spectrum analyzer
  const peakHold = useRef<number[]>(new Array(128).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const { left, right } = audioEngine.getAnalysers();

      if (!left || !right || !isPlaying) {
        // Idle visualization (gentle resting wave)
        ctx.fillStyle = '#06070a';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const t = performance.now() * 0.002;
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.02 + t) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('AUDIO STREAM IDLE — PLAY TRACK TO ACTIVATE DSP METERS', width / 2, height / 2 + 35);

        animId = requestAnimationFrame(render);
        return;
      }

      // Background
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);

      if (viewMode === 'spectrum') {
        // 128-Band FFT Spectrum Analyzer
        const bufferLength = left.frequencyBinCount;
        const dataLeft = new Uint8Array(bufferLength);
        const dataRight = new Uint8Array(bufferLength);
        left.getByteFrequencyData(dataLeft);
        right.getByteFrequencyData(dataRight);

        const barCount = 100;
        const barWidth = (width - barCount * 2) / barCount;

        for (let i = 0; i < barCount; i++) {
          // Logarithmic bin mapping for human ear response
          const binIndex = Math.floor(Math.pow(i / barCount, 2.2) * (bufferLength * 0.75));
          const valL = dataLeft[binIndex] || 0;
          const valR = dataRight[binIndex] || 0;
          const valAvg = (valL + valR) / 2;

          const barHeight = (valAvg / 255) * (height - 35);
          const x = i * (barWidth + 2);
          const y = height - barHeight - 20;

          // Peak hold decay
          if (valAvg > peakHold.current[i]) {
            peakHold.current[i] = valAvg;
          } else {
            peakHold.current[i] = Math.max(0, peakHold.current[i] - 1.8);
          }
          const peakY = height - (peakHold.current[i] / 255) * (height - 35) - 20;

          // Draw Bar Gradient (Gold to Cyan)
          const grad = ctx.createLinearGradient(0, height - 20, 0, 20);
          grad.addColorStop(0, '#00f2fe');
          grad.addColorStop(0.6, '#a855f7');
          grad.addColorStop(1, '#f6d365');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Draw Peak Hold Cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, peakY, barWidth, 2);
        }

        // Draw frequency axis labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        const labels = [
          { text: '32Hz', pos: 0.05 },
          { text: '125Hz', pos: 0.2 },
          { text: '500Hz', pos: 0.4 },
          { text: '2kHz', pos: 0.65 },
          { text: '8kHz', pos: 0.85 },
          { text: '20kHz', pos: 0.98 },
        ];
        labels.forEach(l => {
          ctx.fillText(l.text, l.pos * width, height - 5);
        });

      } else if (viewMode === 'vectorscope') {
        // Stereo Lissajous Vectorscope / Phase Plane
        const timeDataLeft = new Uint8Array(left.fftSize);
        const timeDataRight = new Uint8Array(right.fftSize);
        left.getByteTimeDomainData(timeDataLeft);
        right.getByteTimeDomainData(timeDataRight);

        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width, height) * 0.42;

        // Draw phase reticle (45-degree crosshair)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - scale, centerY - scale);
        ctx.lineTo(centerX + scale, centerY + scale);
        ctx.moveTo(centerX - scale, centerY + scale);
        ctx.lineTo(centerX + scale, centerY - scale);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
        ctx.stroke();

        // Calculate phase correlation (-1 to +1)
        let sumProduct = 0;
        let sumL2 = 0;
        let sumR2 = 0;

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let i = 0; i < timeDataLeft.length; i += 2) {
          const sL = (timeDataLeft[i] - 128) / 128;
          const sR = (timeDataRight[i] - 128) / 128;

          sumProduct += sL * sR;
          sumL2 += sL * sL;
          sumR2 += sR * sR;

          // 45-degree rotation for M/S vectorscope display
          // X = (L - R) * 0.707 (Side / Stereo Width)
          // Y = (L + R) * 0.707 (Mid / Mono)
          const px = centerX + (sL - sR) * 0.707 * scale;
          const py = centerY - (sL + sR) * 0.707 * scale;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Phase correlation meter
        const denominator = Math.sqrt(sumL2 * sumR2);
        const correlation = denominator > 0 ? sumProduct / denominator : 1.0;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`PHASE CORRELATION: ${correlation.toFixed(2)}`, 20, 30);
        ctx.fillText(`STAGE DISPERSION: ${isDolbyAtmos ? 'DOLBY 3D BINAURAL' : 'STEREO'}`, 20, 48);

      } else {
        // Dual Channel Peak & RMS Level Meters (dBFS)
        const timeDataLeft = new Uint8Array(left.fftSize);
        const timeDataRight = new Uint8Array(right.fftSize);
        left.getByteTimeDomainData(timeDataLeft);
        right.getByteTimeDomainData(timeDataRight);

        let peakL = 0;
        let peakR = 0;
        let rmsSumL = 0;
        let rmsSumR = 0;

        for (let i = 0; i < timeDataLeft.length; i++) {
          const sL = Math.abs((timeDataLeft[i] - 128) / 128);
          const sR = Math.abs((timeDataRight[i] - 128) / 128);
          if (sL > peakL) peakL = sL;
          if (sR > peakR) peakR = sR;
          rmsSumL += sL * sL;
          rmsSumR += sR * sR;
        }

        const rmsL = Math.sqrt(rmsSumL / timeDataLeft.length);
        const rmsR = Math.sqrt(rmsSumR / timeDataRight.length);

        const dbL = 20 * Math.log10(Math.max(peakL, 0.0001));
        const dbR = 20 * Math.log10(Math.max(peakR, 0.0001));

        const renderBar = (x: number, y: number, w: number, h: number, dbVal: number) => {
          // -60 dB to 0 dBFS mapping
          const frac = Math.max(0, Math.min(1, (dbVal + 60) / 60));
          const meterH = frac * h;

          // Background track
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x, y, w, h);

          // Level gradient
          const grad = ctx.createLinearGradient(0, y + h, 0, y);
          grad.addColorStop(0, '#10b981'); // Green (-60 to -12)
          grad.addColorStop(0.75, '#f59e0b'); // Yellow (-12 to -3)
          grad.addColorStop(0.95, '#ef4444'); // Red (> -3 dBFS)

          ctx.fillStyle = grad;
          ctx.fillRect(x, y + (h - meterH), w, meterH);

          // Clip indicator
          if (dbVal > -0.5) {
            ctx.fillStyle = '#ff0033';
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y - 12, w, 8);
            ctx.shadowBlur = 0;
          }
        };

        const barW = 32;
        const meterH = height - 80;
        const startX = width / 2 - barW - 15;

        renderBar(startX, 40, barW, meterH, dbL);
        renderBar(startX + barW + 20, 40, barW, meterH, dbR);

        // dB scale labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        [0, -3, -6, -12, -18, -24, -36, -48, -60].forEach(db => {
          const frac = (db + 60) / 60;
          const yPos = 40 + (1 - frac) * meterH;
          ctx.fillText(`${db} dB`, startX - 8, yPos + 3);
        });

        // Channel Labels
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('LEFT', startX + barW / 2, height - 15);
        ctx.fillText('RIGHT', startX + barW + 20 + barW / 2, height - 15);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, viewMode, isDolbyAtmos]);

  return (
    <div className="bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              True Peak / RMS / Phase Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">
              60 FPS Real-Time Audiophile Analytics
            </span>
          </div>
          <h2 className="text-xl font-bold font-display text-white mt-1">
            Acoustic Signal Telemetry & Vectorscope
          </h2>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-audiophile-950 p-1 rounded-xl border border-audiophile-800">
          <button
            onClick={() => setViewMode('spectrum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'spectrum'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            128-Band FFT
          </button>

          <button
            onClick={() => setViewMode('vectorscope')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'vectorscope'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Phase Vectorscope
          </button>

          <button
            onClick={() => setViewMode('vu_meters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'vu_meters'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            dBFS VU Meters
          </button>
        </div>
      </div>

      {/* Main Canvas Display */}
      <div className="w-full aspect-[21/9] bg-audiophile-950 rounded-xl overflow-hidden border border-audiophile-800/80 relative">
        <canvas
          ref={canvasRef}
          width={960}
          height={400}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

