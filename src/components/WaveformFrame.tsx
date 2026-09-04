import React from 'react';

export const WaveformFrame: React.FC<{level: number; accent: string}> = ({level, accent}) => {
  const bars = Array.from({length: 72}, (_, i) => {
    const harmonic = Math.abs(Math.sin(i * 1.77) * Math.cos(i * 0.41));
    return 5 + harmonic * 22 + level * 34 * (0.4 + harmonic);
  });

  const row = (position: 'top' | 'bottom') => (
    <div
      style={{
        position: 'absolute',
        [position]: 14,
        left: 0,
        right: 0,
        height: 52,
        display: 'flex',
        alignItems: position === 'top' ? 'flex-start' : 'flex-end',
        justifyContent: 'space-between',
        padding: '0 3px',
        opacity: 0.78,
        filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))',
      }}
    >
      {bars.map((height, i) => (
        <div
          key={`${position}-${i}`}
          style={{
            width: 3,
            height,
            borderRadius: 3,
            background: i % 6 === 0 ? accent : 'rgba(255,255,255,0.84)',
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {row('top')}
      {row('bottom')}
    </>
  );
};
