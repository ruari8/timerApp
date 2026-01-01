import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerPattern } from '../types';

const PATTERNS_KEY = 'timer_patterns';

export async function savePatterns(patterns: TimerPattern[]): Promise<void> {
  await AsyncStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
}

export async function loadPatterns(): Promise<TimerPattern[]> {
  const data = await AsyncStorage.getItem(PATTERNS_KEY);
  if (!data) return getDefaultPatterns();
  return JSON.parse(data);
}

export async function savePattern(pattern: TimerPattern): Promise<void> {
  const patterns = await loadPatterns();
  const existingIndex = patterns.findIndex(p => p.id === pattern.id);
  
  if (existingIndex >= 0) {
    patterns[existingIndex] = pattern;
  } else {
    patterns.push(pattern);
  }
  
  await savePatterns(patterns);
}

export async function deletePattern(patternId: string): Promise<void> {
  const patterns = await loadPatterns();
  const filtered = patterns.filter(p => p.id !== patternId);
  await savePatterns(filtered);
}

// Default patterns to get started
function getDefaultPatterns(): TimerPattern[] {
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

