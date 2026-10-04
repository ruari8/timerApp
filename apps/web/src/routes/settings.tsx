import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppSettings, SOUND_OPTIONS, SoundKey } from '@repo/shared';
import { storage } from '@/lib/storage';
import { playSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

const SOUND_KEYS = Object.keys(SOUND_OPTIONS) as SoundKey[];

function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    storage.loadSettings().then(setSettings);
  }, []);

  if (!settings) return <div className="min-h-[100dvh] bg-background" />;

  const updateSettings = (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    storage.saveSettings(next);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-cream">
      <header className="px-4 pt-5">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <button
            onClick={() => router.history.back()}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-cream/70 transition-colors hover:text-cream"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-black">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="mx-auto max-w-xl space-y-3">
          <section className="rounded-2xl bg-card p-4">
            <h2 className="font-black">Sound at the end of each step</h2>
            <p className="mb-3 text-sm text-cream/50">Tap to preview. Steps can override this in a routine.</p>
            <div className="flex flex-wrap gap-2">
              {SOUND_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    playSound(key, settings.hapticFeedback);
                    updateSettings({ defaultEndSound: key });
                  }}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                    settings.defaultEndSound === key ? 'bg-cream text-ink' : 'bg-background-tertiary text-cream/60 hover:text-cream'
                  )}
                >
                  {SOUND_OPTIONS[key].label}
                </button>
              ))}
            </div>
          </section>

          <Toggle
            title="3-2-1 countdown beeps"
            description="Short beeps in the last three seconds of each step."
            value={settings.countdownBeeps}
            onChange={(countdownBeeps) => updateSettings({ countdownBeeps })}
          />
          <Toggle
            title="Vibration"
            description="Buzz on step changes, on phones that support it."
            value={settings.hapticFeedback}
            onChange={(hapticFeedback) => updateSettings({ hapticFeedback })}
          />

          <p className="px-1 pt-4 text-xs text-cream/40">
            Keyboard: Space starts and pauses, → skips to the next step, R restarts. On the Timer tab you can type
            digits and press Enter.
          </p>
        </div>
      </main>
    </div>
  );
}

function Toggle({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-card p-4 text-left"
    >
      <span>
        <span className="block font-black">{title}</span>
        <span className="block text-sm text-cream/50">{description}</span>
      </span>
      <span
        className={cn(
          'flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors',
          value ? 'justify-end bg-signal' : 'justify-start bg-background-tertiary'
        )}
      >
        <span className="h-6 w-6 rounded-full bg-cream" />
      </span>
    </button>
  );
}
