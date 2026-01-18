import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  StorageAdapter,
  StorageService,
  TimerPattern,
} from '@repo/shared';

const asyncStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export const storage = new StorageService(asyncStorageAdapter);

export const savePatterns = (patterns: TimerPattern[]) => storage.savePatterns(patterns);
export const loadPatterns = () => storage.loadPatterns();
export const savePattern = (pattern: TimerPattern) => storage.savePattern(pattern);
export const deletePattern = (patternId: string) => storage.deletePattern(patternId);
export const loadSettings = () => storage.loadSettings();
export const saveSettings = (settings: AppSettings) => storage.saveSettings(settings);
