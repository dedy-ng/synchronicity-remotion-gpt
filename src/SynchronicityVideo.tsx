import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import type {SynchronicityVideoProps, TimedSegment} from './types.js';
import {BrandHeader} from './components/BrandHeader.js';
import {EnergyField} from './components/EnergyField.js';
import {KineticCaption} from './components/KineticCaption.js';
import {WaveformFrame} from './components/WaveformFrame.js';

const colors = {
  purple: '#A64DFF',
  cyan: '#31E5F4',
  green: '#74F7A4',
  orange: '#FF8A3D',
  white: '#FFFFFF',
} as const;

const fallbackSegment: TimedSegment = {
  text: '',
  emphasis: [],
  accent: 'purple',
  effect: 'minimal',
  intensity: 0.5,
  start: 0,
  end: 9999,
};

export const SynchronicityVideo: React.FC<SynchronicityVideoProps> = ({audioDataUrl, segments, logoUrl}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const active = segments.find((s) => t >= s.start && t < s.end + 0.08) || segments[segments.length - 1] || fallbackSegment;
  const accent = colors[active.accent];
  const audioData = useAudioData(audioDataUrl);
  const spectrum = audioData
    ? visualizeAudio({audioData, frame, fps, numberOfSamples: 16, optimizeFor: 'speed', smoothing: true})
    : [0.12];
  const level = spectrum.reduce((a, b) => a + b, 0) / spectrum.length;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${accent}19 0%, #07030d 27%, #020204 62%, #000 100%)`,
        overflow: 'hidden',
      }}
    >
      {audioDataUrl ? <Audio src={audioDataUrl} /> : null}
      <EnergyField audioDataUrl={audioDataUrl} accent={accent} intensity={active.intensity} effect={active.effect} />
      <BrandHeader logoUrl={logoUrl} />
      <KineticCaption segment={active} accent={accent} />
      <WaveformFrame level={level} accent={accent} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 48%, rgba(0,0,0,0.55) 88%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
