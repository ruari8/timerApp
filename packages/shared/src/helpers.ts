import { TimerPattern, TimerSegment, TimerBlock } from './types';

// Format seconds to MM:SS or HH:MM:SS
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format duration for display (e.g., "1m 30s", "25m")
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calculate total duration of a pattern (returns -1 for infinite)
export function calculatePatternDuration(pattern: TimerPattern): number {
  let hasInfinite = pattern.repeatEntirePattern === -1;
  
  let blocksDuration = 0;
  for (const block of pattern.blocks) {
    if (block.repeatCount === -1) {
      hasInfinite = true;
      break;
    }
    
    const segmentsDuration = block.segments.reduce(
      (sum, seg) => sum + seg.durationSeconds,
      0
    );
    blocksDuration += segmentsDuration * block.repeatCount;
  }
  
  if (hasInfinite) return -1;
  
  return blocksDuration * (pattern.repeatEntirePattern || 1);
}

// Get current segment info from pattern state
export function getCurrentSegment(
  pattern: TimerPattern,
  blockIndex: number,
  segmentIndex: number
): TimerSegment | null {
  const block = pattern.blocks[blockIndex];
  if (!block) return null;
  return block.segments[segmentIndex] || null;
}

// Get next segment in sequence, handling repeats
export function getNextPosition(
  pattern: TimerPattern,
  blockIndex: number,
  segmentIndex: number,
  blockRepeat: number,
  patternRepeat: number
): {
  blockIndex: number;
  segmentIndex: number;
  blockRepeat: number;
  patternRepeat: number;
  isComplete: boolean;
} {
  const block = pattern.blocks[blockIndex];
  
  // Try next segment in current block
  if (segmentIndex < block.segments.length - 1) {
    return {
      blockIndex,
      segmentIndex: segmentIndex + 1,
      blockRepeat,
      patternRepeat,
      isComplete: false,
    };
  }
  
  // End of segments, try repeating block
  const maxBlockRepeats = block.repeatCount === -1 ? Infinity : block.repeatCount;
  if (blockRepeat < maxBlockRepeats) {
    return {
      blockIndex,
      segmentIndex: 0,
      blockRepeat: blockRepeat + 1,
      patternRepeat,
      isComplete: false,
    };
  }
  
  // Try next block
  if (blockIndex < pattern.blocks.length - 1) {
    return {
      blockIndex: blockIndex + 1,
      segmentIndex: 0,
      blockRepeat: 1,
      patternRepeat,
      isComplete: false,
    };
  }
  
  // End of blocks, try repeating pattern
  const maxPatternRepeats = pattern.repeatEntirePattern === -1 ? Infinity : pattern.repeatEntirePattern;
  if (patternRepeat < maxPatternRepeats) {
    return {
      blockIndex: 0,
      segmentIndex: 0,
      blockRepeat: 1,
      patternRepeat: patternRepeat + 1,
      isComplete: false,
    };
  }
  
  // Truly complete
  return {
    blockIndex,
    segmentIndex,
    blockRepeat,
    patternRepeat,
    isComplete: true,
  };
}

// Create a default segment
export function createDefaultSegment(name: string = 'Timer', color: string = '#F59E0B'): TimerSegment {
  return {
    id: generateId(),
    name,
    durationSeconds: 60,
    color,
  };
}

// Create a default block
export function createDefaultBlock(): TimerBlock {
  return {
    id: generateId(),
    segments: [createDefaultSegment()],
    repeatCount: 1,
  };
}

// Create a default pattern
export function createDefaultPattern(): TimerPattern {
  return {
    id: generateId(),
    name: 'New Timer',
    blocks: [createDefaultBlock()],
    repeatEntirePattern: 1,
    createdAt: Date.now(),
  };
}

// Get default patterns to get started
export function getDefaultPatterns(): TimerPattern[] {
  return [
    {
      id: 'catan-turns',
      name: 'Catan Turns',
      blocks: [
        {
          id: 'turn-block',
          segments: [
            {
              id: 'turn',
              name: 'Turn',
              durationSeconds: 60,
              color: '#F59E0B',
            },
          ],
          repeatCount: -1, // infinite
        },
      ],
      repeatEntirePattern: 1,
      createdAt: Date.now(),
    },
    {
      id: 'couch-to-5k',
      name: 'Couch to 5K',
      blocks: [
        {
          id: 'interval-block',
          segments: [
            {
              id: 'run',
              name: 'Run',
              durationSeconds: 60,
              color: '#E85D04',
            },
            {
              id: 'walk',
              name: 'Walk',
              durationSeconds: 120,
              color: '#2D6A4F',
            },
          ],
          repeatCount: 8,
        },
      ],
      repeatEntirePattern: 1,
      createdAt: Date.now(),
    },
    {
      id: 'pomodoro',
      name: 'Pomodoro',
      blocks: [
        {
          id: 'work-block',
          segments: [
            {
              id: 'focus',
              name: 'Focus',
              durationSeconds: 25 * 60,
              color: '#D90429',
            },
            {
              id: 'short-break',
              name: 'Short Break',
              durationSeconds: 5 * 60,
              color: '#4361EE',
            },
          ],
          repeatCount: 4,
        },
        {
          id: 'long-break-block',
          segments: [
            {
              id: 'long-break',
              name: 'Long Break',
              durationSeconds: 15 * 60,
              color: '#2D6A4F',
            },
          ],
          repeatCount: 1,
        },
      ],
      repeatEntirePattern: -1,
      createdAt: Date.now(),
    },
  ];
}

// A plain one-step countdown, used for quick timers
export function createCountdownPattern(seconds: number): TimerPattern {
  return {
    id: `countdown-${seconds}`,
    name: `${formatDuration(seconds)} timer`,
    blocks: [
      {
        id: 'countdown',
        segments: [{ id: 'countdown', name: 'Timer', durationSeconds: seconds, color: '#0E7490' }],
        repeatCount: 1,
      },
    ],
    repeatEntirePattern: 1,
    createdAt: Date.now(),
  };
}

// Work/rest intervals repeated for a number of rounds (-1 for forever); rest of 0 is skipped
export function createIntervalPattern(
  workSeconds: number,
  restSeconds: number,
  rounds: number
): TimerPattern {
  const segments: TimerSegment[] = [
    { id: 'work', name: 'Work', durationSeconds: workSeconds, color: '#E85D04' },
  ];
  if (restSeconds > 0) {
    segments.push({ id: 'rest', name: 'Rest', durationSeconds: restSeconds, color: '#2D6A4F' });
  }
  const roundsLabel = rounds === -1 ? '' : ` × ${rounds}`;
  return {
    id: `intervals-${workSeconds}-${restSeconds}-${rounds}`,
    name: `${formatDuration(workSeconds)} / ${formatDuration(restSeconds)}${roundsLabel}`,
    blocks: [{ id: 'intervals', segments, repeatCount: rounds }],
    repeatEntirePattern: 1,
    createdAt: Date.now(),
  };
}

// True when the pattern is a single step that plays once
export function isSimpleCountdown(pattern: TimerPattern): boolean {
  return (
    pattern.blocks.length === 1 &&
    pattern.blocks[0].segments.length === 1 &&
    pattern.blocks[0].repeatCount === 1 &&
    pattern.repeatEntirePattern === 1
  );
}

// Seconds left in the pattern after the given position's step finishes (-1 for infinite)
export function getRemainingAfter(
  pattern: TimerPattern,
  blockIndex: number,
  segmentIndex: number,
  blockRepeat: number,
  patternRepeat: number
): number {
  if (calculatePatternDuration(pattern) === -1) return -1;
  let total = 0;
  let pos = { blockIndex, segmentIndex, blockRepeat, patternRepeat };
  for (;;) {
    const next = getNextPosition(pattern, pos.blockIndex, pos.segmentIndex, pos.blockRepeat, pos.patternRepeat);
    if (next.isComplete) return total;
    total += getCurrentSegment(pattern, next.blockIndex, next.segmentIndex)?.durationSeconds ?? 0;
    pos = next;
  }
}
