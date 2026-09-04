import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TimedSegment} from '../types.js';

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export const KineticCaption: React.FC<{segment: TimedSegment; accent: string}> = ({segment, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const startFrame = segment.start * fps;
  const endFrame = segment.end * fps;
  const localFrame = Math.max(0, frame - startFrame);
  const entrance = spring({fps, frame: localFrame, config: {damping: 14, stiffness: 170, mass: 0.72}});
  const exit = interpolate(frame, [endFrame - 7, endFrame + 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = interpolate(entrance, [0, 1], [0.76, 1]) * (segment.effect === 'burst' ? 1.04 : 1);
  const opacity = Math.min(1, entrance * 1.4) * exit;
  const tokens = segment.text.split(/\s+/).filter(Boolean);
  const emphasized = new Set((segment.emphasis || []).flatMap((e) => e.split(/\s+/)).map(normalize));
  const chars = segment.text.length;
  const fontSize = chars <= 12 ? 104 : chars <= 22 ? 88 : chars <= 36 ? 72 : 60;

  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: '50%',
        transform: `translateY(-50%) scale(${scale})`,
        opacity,
        textAlign: 'center',
        fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
        fontWeight: 900,
        fontSize,
        lineHeight: 0.98,
        letterSpacing: -2.2,
        textTransform: 'uppercase',
        textShadow: `0 0 10px rgba(255,255,255,0.24), 0 0 34px ${accent}88`,
      }}
    >
      {tokens.map((token, i) => {
        const active = emphasized.has(normalize(token));
        return (
          <React.Fragment key={`${token}-${i}`}>
            <span
              style={{
                display: 'inline-block',
                color: active ? accent : '#FFFFFF',
                textShadow: active ? `0 0 16px ${accent}, 0 0 36px ${accent}` : undefined,
                transform: active && segment.effect === 'burst' ? `scale(${1.04 + 0.02 * Math.sin(localFrame / 2)})` : undefined,
              }}
            >
              {token}
            </span>
            {i < tokens.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};
