import { TimerPattern, TimerSegment, TimerBlock } from '../types';

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

