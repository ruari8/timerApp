import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, SOUND_OPTIONS, SoundKey } from '@repo/shared';
import { storage } from '@/lib/storage';
import { playSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/settings' as any)({
  component: SettingsPage,
});

const SKIP_OPTIONS = [3, 5, 10, 15, 30];
const SOUND_KEYS = Object.keys(SOUND_OPTIONS) as SoundKey[];

function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.loadSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    await storage.saveSettings(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-12 px-6 pb-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-sm font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Back
          </Link>
          <span className="text-sm text-neutral-500">Settings</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Skip ahead</h2>
              <p className="text-sm text-neutral-500">
                When you tap skip, the timer jumps to this many seconds remaining.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKIP_OPTIONS.map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => updateSettings({ skipAheadSeconds: seconds })}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-semibold transition-colors',
                    settings.skipAheadSeconds === seconds
                      ? 'bg-amber-500 text-background border-amber-400'
                      : 'bg-background-tertiary text-neutral-400 border-border hover:border-border-light'
                  )}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Default alert sound</h2>
              <p className="text-sm text-neutral-500">
                Sound for new segments. Tap to preview.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOUND_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    playSound(key, settings.hapticFeedback);
                    updateSettings({ defaultEndSound: key });
                  }}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-semibold transition-colors',
                    settings.defaultEndSound === key
                      ? 'bg-amber-500 text-background border-amber-400'
                      : 'bg-background-tertiary text-neutral-400 border-border hover:border-border-light'
                  )}
                >
                  {SOUND_OPTIONS[key].label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Haptic feedback</h2>
              <p className="text-sm text-neutral-500">
                Vibration on timer transitions and ticks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
              className={cn(
                'w-14 h-8 rounded-full border transition-colors flex items-center',
                settings.hapticFeedback
                  ? 'bg-amber-500 border-amber-400 justify-end'
                  : 'bg-background-tertiary border-border justify-start'
              )}
            >
              <span className="w-6 h-6 bg-neutral-50 rounded-full" />
            </button>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-neutral-100">About</h2>
            <p className="text-sm text-neutral-500 mt-2">
              Programmable interval timers for workouts, productivity, and game nights.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
