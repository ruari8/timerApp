// Timer segment - one phase of the timer pattern
export interface TimerSegment {
  id: string;
  name: string;
  durationSeconds: number;
  color: string;
}

// A group of segments that can repeat
export interface TimerBlock {
  id: string;
  segments: TimerSegment[];
  repeatCount: number; // -1 for infinite
}

// A complete timer pattern
export interface TimerPattern {
  id: string;
  name: string;
  blocks: TimerBlock[];
  repeatEntirePattern: number; // -1 for infinite, how many times to loop the whole thing
  createdAt: number;
}

// Current timer state when running
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentBlockIndex: number;
  currentSegmentIndex: number;
  currentBlockRepeat: number;
  currentPatternRepeat: number;
  remainingSeconds: number;
  totalElapsedSeconds: number;
}

// Preset colors for segments
export const SEGMENT_COLORS = {
  work: '#E85D04',
  rest: '#2D6A4F',
  sprint: '#D90429',
  walk: '#4361EE',
  custom1: '#7B2CBF',
  custom2: '#F72585',
  neutral: '#6C757D',
} as const;

export type SegmentColorKey = keyof typeof SEGMENT_COLORS;

