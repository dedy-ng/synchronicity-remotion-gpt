import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import type {Effect} from '../types.js';

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace('#', '');
  const value = parseInt(cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned, 16);
  return {r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255};
};

export const EnergyField: React.FC<{
  audioDataUrl: string;
  accent: string;
  intensity: number;
  effect: Effect;
}> = ({audioDataUrl, accent, intensity, effect}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(audioDataUrl);

  const spectrum = audioData
    ? visualizeAudio({audioData, frame, fps, numberOfSamples: 64, smoothing: true, optimizeFor: 'speed'})
    : Array.from({length: 64}, (_, i) => 0.16 + 0.08 * Math.abs(Math.sin(frame / 7 + i)));

  const level = spectrum.reduce((sum, n) => sum + n, 0) / spectrum.length;
  const {r, g, b} = hexToRgb(accent);
  const pulse = 1 + Math.min(0.18, level * 0.7) + 0.018 * Math.sin(frame / 3);
  const radius = effect === 'minimal' ? 188 : effect === 'burst' ? 230 : 208;
  const raysOpacity = effect === 'minimal' ? 0.08 : effect === 'tunnel' ? 0.42 : effect === 'burst' ? 0.58 : 0.24;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: -260,
          background: `repeating-conic-gradient(from ${frame * 0.22}deg at 50% 50%, rgba(${r},${g},${b},${0.12 * intensity}) 0deg 0.45deg, transparent 0.55deg 4.1deg)`,
          transform: `scale(${effect === 'tunnel' ? 1.14 + level * 0.2 : 1})`,
          opacity: raysOpacity,
          filter: `blur(${effect === 'burst' ? 0.3 : 1.2}px)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 920,
          height: 920,
          transform: `translate(-50%, -50%) scale(${pulse})`,
        }}
      >
        <svg width="920" height="920" viewBox="0 0 920 920">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {spectrum.map((v, i) => {
            const angle = (Math.PI * 2 * i) / spectrum.length - Math.PI / 2;
            const inner = radius + 40;
            const outer = inner + 135 + Math.pow(v, 0.65) * (310 + intensity * 120);
            const x1 = 460 + Math.cos(angle) * inner;
            const y1 = 460 + Math.sin(angle) * inner;
            const x2 = 460 + Math.cos(angle) * outer;
            const y2 = 460 + Math.sin(angle) * outer;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 5 === 0 ? '#FFFFFF' : accent}
                strokeWidth={2.4 + v * 8}
                strokeLinecap="round"
                opacity={0.18 + v * 0.92}
                filter="url(#glow)"
              />
            );
          })}

          <circle
            cx="460"
            cy="460"
            r={radius}
            fill="rgba(0,0,0,0.48)"
            stroke={accent}
            strokeWidth={9 + level * 20}
            opacity={0.9}
            filter="url(#glow)"
          />
          <circle
            cx="460"
            cy="460"
            r={radius - 22}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.3}
            opacity={0.4 + level * 0.5}
          />
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 880,
          height: 880,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(0,0,0,0) 32%, rgba(${r},${g},${b},${0.12 + level * 0.16}) 49%, rgba(0,0,0,0) 69%)`,
          filter: 'blur(28px)',
        }}
      />
    </>
  );
};
