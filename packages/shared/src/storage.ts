import { TimerPattern, AppSettings, DEFAULT_SETTINGS, StorageAdapter } from './types';
import { getDefaultPatterns } from './helpers';

const PATTERNS_KEY = 'timer_patterns';
const SETTINGS_KEY = 'app_settings';

// Storage service that uses an adapter pattern for cross-platform support
export class StorageService {
  constructor(private adapter: StorageAdapter) {}

  async savePatterns(patterns: TimerPattern[]): Promise<void> {
    await this.adapter.setItem(PATTERNS_KEY, JSON.stringify(patterns));
  }

  async loadPatterns(): Promise<TimerPattern[]> {
    const data = await this.adapter.getItem(PATTERNS_KEY);
    if (!data) return getDefaultPatterns();
    return JSON.parse(data);
  }

  async savePattern(pattern: TimerPattern): Promise<void> {
    const patterns = await this.loadPatterns();
    const existingIndex = patterns.findIndex(p => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      patterns[existingIndex] = pattern;
    } else {
      patterns.push(pattern);
    }
    
    await this.savePatterns(patterns);
  }

  async deletePattern(patternId: string): Promise<void> {
    const patterns = await this.loadPatterns();
    const filtered = patterns.filter(p => p.id !== patternId);
    await this.savePatterns(filtered);
  }

  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await this.adapter.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.adapter.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
