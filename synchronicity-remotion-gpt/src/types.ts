export type Accent = 'purple' | 'cyan' | 'green' | 'orange' | 'white';
export type Effect = 'ring' | 'burst' | 'tunnel' | 'minimal';

export type WordTiming = {
  text: string;
  start: number;
  end: number;
};

export type PlannedSegment = {
  text: string;
  emphasis?: string[];
  accent?: Accent;
  effect?: Effect;
  intensity?: number;
};

export type TimedSegment = PlannedSegment & {
  start: number;
  end: number;
  accent: Accent;
  effect: Effect;
  intensity: number;
};

export type SynchronicityVideoProps = {
  script: string;
  audioDataUrl: string;
  durationSeconds: number;
  segments: TimedSegment[];
  logoUrl?: string;
};
