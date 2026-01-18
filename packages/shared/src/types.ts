// Available sound options
export const SOUND_OPTIONS = {
  none: { label: 'None', file: null },
  bell: { label: 'Bell', file: 'bell' },
  chime: { label: 'Chime', file: 'chime' },
  beep: { label: 'Beep', file: 'beep' },
  gong: { label: 'Gong', file: 'gong' },
  whistle: { label: 'Whistle', file: 'whistle' },
} as const;

export type SoundKey = keyof typeof SOUND_OPTIONS;

// Timer segment - one phase of the timer pattern
export interface TimerSegment {
  id: string;
  name: string;
  durationSeconds: number;
  color: string;
  endSound?: SoundKey; // Sound to play when this segment ends
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

// App-wide settings
export interface AppSettings {
  skipAheadSeconds: number; // How many seconds to leave when skipping (default 5)
  defaultEndSound: SoundKey; // Default sound for new segments
  hapticFeedback: boolean; // Whether to use haptic feedback
}

export const DEFAULT_SETTINGS: AppSettings = {
  skipAheadSeconds: 5,
  defaultEndSound: 'bell',
  hapticFeedback: true,
};

// Storage adapter interface for cross-platform persistence
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
