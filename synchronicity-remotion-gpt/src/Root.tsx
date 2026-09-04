import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {SynchronicityVideo} from './SynchronicityVideo.js';
import type {SynchronicityVideoProps} from './types.js';

const defaultProps: SynchronicityVideoProps = {
  script: 'Your attention changes what becomes visible.',
  audioDataUrl: staticFile('silence.wav'),
  durationSeconds: 6,
  segments: [
    {
      text: 'YOUR ATTENTION',
      emphasis: ['ATTENTION'],
      accent: 'purple',
      effect: 'burst',
      intensity: 0.9,
      start: 0,
      end: 2,
    },
    {
      text: 'CHANGES WHAT BECOMES VISIBLE',
      emphasis: ['VISIBLE'],
      accent: 'green',
      effect: 'ring',
      intensity: 0.7,
      start: 2,
      end: 6,
    },
  ],
};

const calculateMetadata: CalculateMetadataFunction<SynchronicityVideoProps> = ({props}) => {
  return {
    durationInFrames: Math.max(1, Math.ceil(props.durationSeconds * 30)),
    props,
    defaultCodec: 'h264',
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SynchronicityShort"
      component={SynchronicityVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={180}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
