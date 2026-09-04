import React from 'react';
import {Img} from 'remotion';

export const BrandHeader: React.FC<{logoUrl?: string}> = ({logoUrl}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.92,
      }}
    >
      {logoUrl ? (
        <Img src={logoUrl} style={{width: 245, maxHeight: 92, objectFit: 'contain'}} />
      ) : (
        <div
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 31,
            letterSpacing: 0.4,
            color: '#77E9FF',
            textShadow: '0 0 18px rgba(119,233,255,0.65)',
          }}
        >
          Synchronicity.fm
        </div>
      )}
    </div>
  );
};
