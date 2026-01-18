import { StorageAdapter, StorageService } from '@repo/shared';

// localStorage adapter for web
const localStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

// Create and export the storage service instance
export const storage = new StorageService(localStorageAdapter);
