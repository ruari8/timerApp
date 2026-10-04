import { useEffect, useState } from 'react';
import { AppSettings } from '@repo/shared';
import { storage } from './storage';

// Returns null until settings have loaded from storage
export function useSettings(): AppSettings | null {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  useEffect(() => {
    storage.loadSettings().then(setSettings);
  }, []);
  return settings;
}
