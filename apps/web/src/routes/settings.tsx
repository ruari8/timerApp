import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS, SOUND_OPTIONS, SoundKey } from '@repo/shared';
import { storage } from '@/lib/storage';
import { playSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/settings')({
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-cream/45">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-cream">
      <header className="border-b border-border bg-background/90 px-5 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-cream/65 transition-colors hover:border-aqua hover:text-aqua"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-sm font-bold uppercase text-cream/45">Settings</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="px-5 py-8 pb-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="space-y-3 rounded-lg border border-border bg-card p-6 panel-shadow">
            <div>
              <h2 className="text-xl font-black text-cream">Skip ahead</h2>
              <p className="text-sm text-cream/50">
                When you tap skip, the timer jumps to this many seconds remaining.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKIP_OPTIONS.map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => updateSettings({ skipAheadSeconds: seconds })}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-black transition-colors',
                    settings.skipAheadSeconds === seconds
                      ? 'border-signal bg-signal text-ink'
                      : 'border-border bg-background-tertiary text-cream/55 hover:border-aqua hover:text-aqua'
                  )}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-6 panel-shadow">
            <div>
              <h2 className="text-xl font-black text-cream">Default alert sound</h2>
              <p className="text-sm text-cream/50">
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
                    'rounded-lg border px-4 py-2 text-sm font-black transition-colors',
                    settings.defaultEndSound === key
                      ? 'border-signal bg-signal text-ink'
                      : 'border-border bg-background-tertiary text-cream/55 hover:border-aqua hover:text-aqua'
                  )}
                >
                  {SOUND_OPTIONS[key].label}
                </button>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-6 panel-shadow">
            <div>
              <h2 className="text-xl font-black text-cream">Haptic feedback</h2>
              <p className="text-sm text-cream/50">
                Vibration on timer transitions and ticks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
              className={cn(
                'flex h-8 w-14 items-center rounded-full border transition-colors',
                settings.hapticFeedback
                  ? 'justify-end border-signal bg-signal'
                  : 'justify-start border-border bg-background-tertiary'
              )}
              aria-label={settings.hapticFeedback ? 'Turn haptic feedback off' : 'Turn haptic feedback on'}
            >
              <span className="h-6 w-6 rounded-full bg-cream" />
            </button>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 panel-shadow">
            <h2 className="text-xl font-black text-cream">About</h2>
            <p className="mt-2 text-sm text-cream/50">
              Programmable interval timers for workouts, productivity, and game nights.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
