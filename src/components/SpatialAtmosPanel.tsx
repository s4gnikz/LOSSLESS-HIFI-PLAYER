import React, { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { SpatialMode, SpatialSettings } from '../types/audio';
import { Volume2, Sparkles, Compass, Eye, RotateCcw, HelpCircle, Layers, Activity } from 'lucide-react';

interface SpatialAtmosPanelProps {
  settings: SpatialSettings;
  onUpdateSettings: (settings: Partial<SpatialSettings>) => void;
  isPlaying: boolean;
}

export const SpatialAtmosPanel: React.FC<SpatialAtmosPanelProps> = ({
  settings,
  onUpdateSettings,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState({ yaw: 25, pitch: 35 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  const modes: Array<{ id: SpatialMode; name: string; desc: string; icon: string }> = [
    {
      id: 'atmos_7_1_4',
      name: 'Dolby Atmos 7.1.4',
      desc: 'Discrete 12-channel binaural object array with 4 height speakers.',
      icon: '✨'
    },
    {
      id: 'binaural_studio',
      name: 'Binaural Studio',
      desc: 'Reference near-field mastering acoustics optimized for audiophile headphones.',
      icon: '🎧'
    },
    {
      id: 'spatial_wide',
      name: 'Spatial 3D Wide',
      desc: 'Acoustic crosstalk cancellation & extended stereo stage width.',
      icon: '🌐'
    },
    {
      id: 'concert_hall',
      name: 'Concert Hall Immersion',
      desc: 'Spacious acoustic reverberation with realistic early reflections.',
      icon: '🏛️'
    },
    {
      id: 'stereo',
      name: 'Stereo Pure',
      desc: 'Bypasses multi-channel virtualizer for untouched 2-channel stereo.',
      icon: '🔊'
    }
  ];

  // Mouse drag handlers for 3D room rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: rotationAngle.yaw,
      pitch: rotationAngle.pitch
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotationAngle({
      yaw: (dragStart.current.yaw + dx * 0.5) % 360,
      pitch: Math.max(10, Math.min(80, dragStart.current.pitch - dy * 0.5))
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // 3D Canvas Rendering
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

      const centerX = width / 2;
      const centerY = height / 2 + 15;
      const radius = Math.min(width, height) * 0.38;

      // Projection math with yaw and pitch
      const radYaw = (rotationAngle.yaw * Math.PI) / 180;
      const radPitch = (rotationAngle.pitch * Math.PI) / 180;

      const project3D = (x: number, y: number, z: number) => {
        // Rotate around Y axis (yaw)
        const x1 = x * Math.cos(radYaw) - z * Math.sin(radYaw);
        const z1 = x * Math.sin(radYaw) + z * Math.cos(radYaw);

        // Rotate around X axis (pitch)
        const y2 = y * Math.cos(radPitch) - z1 * Math.sin(radPitch);
        const z2 = y * Math.sin(radPitch) + z1 * Math.cos(radPitch);

        // Perspective division
        const distance = 4.0;
        const scale = distance / (distance + z2 * 0.5);

        return {
          px: centerX + x1 * scale * radius,
          py: centerY - y2 * scale * radius,
          scale,
          depth: z2
        };
      };

      // Draw Orbit / Elevation Rings
      ctx.save();
      ctx.lineWidth = 1;

      // Ground plane grid (Z=0)
      ctx.strokeStyle = 'rgba(79, 172, 254, 0.15)';
      ctx.beginPath();
      for (let a = 0; a <= 360; a += 10) {
        const rad = (a * Math.PI) / 180;
        const p = project3D(Math.sin(rad), 0, -Math.cos(rad));
        if (a === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();

      // Height Elevation Ring (y = 0.707 for top speakers)
      if (settings.mode !== 'stereo') {
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 10) {
          const rad = (a * Math.PI) / 180;
          const p = project3D(Math.sin(rad) * 0.75, 0.75 * settings.heightImmersion, -Math.cos(rad) * 0.75);
          if (a === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Listener (Center Head)
      const centerProj = project3D(0, 0, 0);
      const headRadius = 14 * centerProj.scale;

      // Glow behind listener
      const headGlow = ctx.createRadialGradient(centerProj.px, centerProj.py, 2, centerProj.px, centerProj.py, headRadius * 2.5);
      headGlow.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
      headGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(centerProj.px, centerProj.py, headRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Listener Avatar / Headphones
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerProj.px, centerProj.py, headRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orientation nose pointer
      const headAngleRad = ((settings.listenerAngle - 90) * Math.PI) / 180;
      const noseX = centerProj.px + Math.cos(headAngleRad - radYaw) * (headRadius + 4);
      const noseY = centerProj.py + Math.sin(headAngleRad - radYaw) * (headRadius + 4) * Math.cos(radPitch);
      ctx.fillStyle = '#f6d365';
      ctx.beginPath();
      ctx.arc(noseX, noseY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw 7.1.4 Speakers
      const speakers = audioEngine.getSpeakerNodes();
      const time = performance.now() * 0.003;

      // Sort speakers by depth for proper painter's algorithm
      const projectedSpeakers = speakers.map(spk => {
        const spread = settings.surroundSpread;
        const heightFac = settings.heightImmersion;
        const az = spk.azimuth * spread;
        const el = spk.elevation * heightFac;

        const radAz = (az * Math.PI) / 180;
        const radEl = (el * Math.PI) / 180;

        const x = Math.cos(radEl) * Math.sin(radAz);
        const y = Math.sin(radEl);
        const z = -Math.cos(radEl) * Math.cos(radAz);

        const proj = project3D(x, y, z);
        return { spk, proj, isHeight: spk.channel.startsWith('T'), isSub: spk.channel === 'LFE' };
      }).sort((a, b) => b.proj.depth - a.proj.depth);

      projectedSpeakers.forEach(({ spk, proj, isHeight, isSub }) => {
        // Soundwave ray to center listener if playing
        if (isPlaying && settings.enabled && settings.mode !== 'stereo') {
          const rayPulse = (Math.sin(time * 3 + spk.azimuth) + 1) * 0.5;
          ctx.strokeStyle = isHeight
            ? `rgba(212, 175, 55, ${0.1 + rayPulse * 0.3})`
            : isSub
            ? `rgba(239, 68, 68, ${0.1 + rayPulse * 0.3})`
            : `rgba(0, 242, 254, ${0.1 + rayPulse * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(proj.px, proj.py);
          ctx.lineTo(centerProj.px, centerProj.py);
          ctx.stroke();

          // Ripple rings
          if (rayPulse > 0.6) {
            ctx.strokeStyle = isHeight ? 'rgba(255, 223, 120, 0.4)' : 'rgba(0, 242, 254, 0.4)';
            ctx.beginPath();
            ctx.arc(proj.px, proj.py, (12 + rayPulse * 16) * proj.scale, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Speaker Sphere
        const spkRadius = (isHeight ? 7 : isSub ? 9 : 8) * proj.scale;
        const spkColor = isSub
          ? '#ef4444'
          : isHeight
          ? '#d4af37'
          : '#00f2fe';

        ctx.fillStyle = spkColor;
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, spkRadius, 0, Math.PI * 2);
        ctx.fill();

        // White highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(proj.px - spkRadius * 0.3, proj.py - spkRadius * 0.3, spkRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Speaker Channel Label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `${Math.max(9, Math.round(10 * proj.scale))}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText(spk.channel, proj.px, proj.py + spkRadius + 12);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [rotationAngle, isPlaying, settings]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Dolby Atmos Spatial Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                12-Channel HRTF Binaural Synthesis
              </span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white mt-1">
              3D Soundstage & Height Dimension
            </h2>
          </div>

          {/* Master Spatial Enable Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Spatial Processing:
            </span>
            <button
              onClick={() => onUpdateSettings({ enabled: !settings.enabled })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                settings.enabled
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                  : 'bg-audiophile-800 text-slate-400 hover:text-white border border-audiophile-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {settings.enabled ? 'ACTIVE (ATMOS ON)' : 'BYPASS (STEREO)'}
            </button>
          </div>
        </div>

        {/* Spatial Preset Modes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {modes.map(mode => {
            const isSelected = settings.mode === mode.id && settings.enabled;
            return (
              <button
                key={mode.id}
                onClick={() => onUpdateSettings({ mode: mode.id, enabled: mode.id !== 'stereo' })}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/60 to-audiophile-850 border-cyan-500/60 shadow-[0_0_20px_rgba(0,242,254,0.15)] ring-1 ring-cyan-400'
                    : 'bg-audiophile-850/80 hover:bg-audiophile-800/80 border-audiophile-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xl mb-1.5">{mode.icon}</div>
                <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {mode.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {mode.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 3D Room & Acoustic Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 3D Soundstage Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Interactive 7.1.4 Speaker Soundstage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Drag to Rotate
              </span>
              <button
                onClick={() => setRotationAngle({ yaw: 25, pitch: 35 })}
                className="text-[11px] px-2 py-0.5 rounded bg-audiophile-800 hover:bg-audiophile-700 text-slate-300 border border-audiophile-700"
              >
                Reset Angle
              </button>
            </div>
          </div>

          <div className="relative w-full aspect-[16/10] bg-audiophile-950/90 rounded-xl overflow-hidden border border-audiophile-800/80 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              width={700}
              height={440}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full object-contain"
            />

            {/* Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-audiophile-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-audiophile-800 text-[10px] font-mono flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f2fe]" /> Bed (7.1)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-atmos shadow-[0_0_6px_#d4af37]" /> Heights (.4)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" /> LFE Sub
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-mono">
            Full 7.1.4 bed reproduction: Front Left/Right, Center, LFE, Sides, Rears, and Top Height channels binaurally projected using Head-Related Transfer Functions.
          </p>
        </div>

        {/* Spatial & Acoustic Adjusters (5 Cols) */}
        <div className="lg:col-span-5 bg-audiophile-900 border border-audiophile-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-audiophile-800">
            <Layers className="w-4 h-4 text-gold-atmos" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Acoustic Dimension Parameters
            </h3>
          </div>

          {/* Surround Spread */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Surround Soundstage Width</span>
              <span className="font-mono text-cyan-400">{(settings.surroundSpread * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={settings.surroundSpread}
              onChange={(e) => onUpdateSettings({ surroundSpread: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Narrow Studio</span>
              <span>Ultra-Wide 360°</span>
            </div>
          </div>

          {/* Height Immersion */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Height Immersion (Overhead Atmos)</span>
              <span className="font-mono text-gold-glow">{(settings.heightImmersion * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={settings.heightImmersion}
              onChange={(e) => onUpdateSettings({ heightImmersion: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-gold-atmos"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Ear-Level Flat</span>
              <span>Cathedral Dome</span>
            </div>
          </div>

          {/* Room Acoustic Decay (Convolver Reverb) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Room Acoustic Dimensions & Decay</span>
              <span className="font-mono text-indigo-400">{(settings.reverbDecay * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.reverbDecay}
              onChange={(e) => onUpdateSettings({ reverbDecay: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Anechoic Dry</span>
              <span>Symphonic Hall</span>
            </div>
          </div>

          {/* LFE Subwoofer Channel Boost */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">LFE Sub-Bass Impact</span>
              <span className="font-mono text-red-400">
                {settings.lfeBoost > 0 ? `+${settings.lfeBoost.toFixed(1)} dB` : `${settings.lfeBoost.toFixed(1)} dB`}
              </span>
            </div>
            <input
              type="range"
              min="-6.0"
              max="10.0"
              step="0.5"
              value={settings.lfeBoost}
              onChange={(e) => onUpdateSettings({ lfeBoost: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Attenuated</span>
              <span>Subwoofer Rumble</span>
            </div>
          </div>

          {/* Center Dialogue / Vocal Focus */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Center Channel Vocal Focus</span>
              <span className="font-mono text-emerald-400">{(settings.centerFocus * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.2"
              step="0.05"
              value={settings.centerFocus}
              onChange={(e) => onUpdateSettings({ centerFocus: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Listener Head-Tracking / Angle */}
          <div className="space-y-1.5 pt-2 border-t border-audiophile-800">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Virtual Head Angle (Azimuth Offset)</span>
              <span className="font-mono text-amber-400">{settings.listenerAngle.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={settings.listenerAngle}
              onChange={(e) => onUpdateSettings({ listenerAngle: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-audiophile-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
