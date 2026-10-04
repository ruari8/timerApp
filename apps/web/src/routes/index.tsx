import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Delete, Play, Save } from 'lucide-react';
import { createIntervalPattern, formatTime, generateId } from '@repo/shared';
import { AppShell } from '@/components/AppShell';
import { DurationField, RepeatStepper } from '@/components/inputs';
import { loadPref, savePref } from '@/lib/prefs';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: TimerTab,
});

type Mode = 'countdown' | 'intervals';

interface TimerPrefs {
  mode: Mode;
  digits: string;
  work: number;
  rest: number;
  rounds: number;
}

const PREFS_KEY = 'timer_tab_prefs';
const DEFAULT_PREFS: TimerPrefs = { mode: 'countdown', digits: '500', work: 40, rest: 20, rounds: 8 };

const PRESETS = [
  { label: '1 min', digits: '100' },
  { label: '3 min', digits: '300' },
  { label: '5 min', digits: '500' },
  { label: '10 min', digits: '1000' },
  { label: '15 min', digits: '1500' },
  { label: '20 min', digits: '2000' },
  { label: '30 min', digits: '3000' },
  { label: '45 min', digits: '4500' },
  { label: '1 hr', digits: '10000' },
];

// Keypad entry fills from the right like a microwave: "2", "20", "200", "2000" → 20:00
function digitsToParts(digits: string) {
  const padded = digits.padStart(6, '0');
  return { h: Number(padded.slice(0, 2)), m: Number(padded.slice(2, 4)), s: Number(padded.slice(4, 6)) };
}

function digitsToSeconds(digits: string) {
  const { h, m, s } = digitsToParts(digits);
  return h * 3600 + m * 60 + s;
}

function TimerTab() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<TimerPrefs>(() => loadPref(PREFS_KEY, DEFAULT_PREFS));

  const update = useCallback((changes: Partial<TimerPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...changes };
      savePref(PREFS_KEY, next);
      return next;
    });
  }, []);

  const countdownSeconds = digitsToSeconds(prefs.digits);

  const startCountdown = useCallback(() => {
    if (countdownSeconds <= 0) return;
    navigate({ to: '/run', search: { s: countdownSeconds } });
  }, [countdownSeconds, navigate]);

  const startIntervals = () => {
    navigate({ to: '/run', search: { work: prefs.work, rest: prefs.rest, rounds: prefs.rounds } });
  };

  const saveIntervals = async () => {
    const pattern = { ...createIntervalPattern(prefs.work, prefs.rest, prefs.rounds), id: generateId() };
    await storage.savePattern(pattern);
    navigate({ to: '/editor/$id', params: { id: pattern.id } });
  };

  const intervalTotal =
    prefs.rounds === -1 ? null : (prefs.work + prefs.rest) * prefs.rounds;

  return (
    <AppShell title="Timer">
      <div className="mb-6 grid grid-cols-2 rounded-full bg-card p-1">
        {(['countdown', 'intervals'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => update({ mode })}
            className={cn(
              'rounded-full py-2.5 text-sm font-black capitalize transition-colors',
              prefs.mode === mode ? 'bg-cream text-ink' : 'text-cream/55 hover:text-cream'
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {prefs.mode === 'countdown' ? (
        <Countdown
          digits={prefs.digits}
          onDigits={(digits) => update({ digits })}
          onStart={startCountdown}
          canStart={countdownSeconds > 0}
        />
      ) : (
        <div className="space-y-3">
          <Row label="Work">
            <DurationField label="work" value={prefs.work} onChange={(work) => update({ work })} />
          </Row>
          <Row label="Rest" hint="0 to skip">
            <DurationField label="rest" value={prefs.rest} min={0} onChange={(rest) => update({ rest })} />
          </Row>
          <Row label="Rounds">
            <RepeatStepper label="rounds" value={prefs.rounds} onChange={(rounds) => update({ rounds })} />
          </Row>

          <p className="pt-2 text-center text-sm font-bold text-cream/50">
            {intervalTotal === null ? 'Repeats until you stop it' : `Total ${formatTime(intervalTotal)}`}
          </p>

          <StartButton onClick={startIntervals} />
          <button
            onClick={saveIntervals}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-cream/60 transition-colors hover:text-cream"
          >
            <Save className="h-4 w-4" />
            Save as routine
          </button>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3">
      <div>
        <p className="font-black">{label}</p>
        {hint ? <p className="text-xs text-cream/40">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function StartButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-signal py-4 text-lg font-black text-ink transition-colors hover:bg-cream disabled:opacity-30"
    >
      <Play className="h-5 w-5" fill="currentColor" />
      Start
    </button>
  );
}

function Countdown({
  digits,
  onDigits,
  onStart,
  canStart,
}: {
  digits: string;
  onDigits: (digits: string) => void;
  onStart: () => void;
  canStart: boolean;
}) {
  const { h, m, s } = digitsToParts(digits);
  // Typing replaces the remembered value instead of appending to it
  const [fresh, setFresh] = useState(true);

  const press = useCallback(
    (key: string) => {
      setFresh(false);
      const base = fresh ? '' : digits;
      if (key === 'back') onDigits(base.slice(0, -1));
      else onDigits((base + key).replace(/^0+/, '').slice(0, 6));
    },
    [digits, fresh, onDigits]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') onStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, onStart]);

  const unit = (value: number, suffix: string, show: boolean) => (
    <span className={cn('transition-colors', show ? 'text-cream' : 'text-cream/25')}>
      {String(value).padStart(2, '0')}
      <span className="ml-0.5 text-2xl sm:text-3xl">{suffix}</span>
    </span>
  );

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-center gap-3 font-mono text-5xl font-black tabular-nums sm:text-6xl">
        {unit(h, 'h', h > 0)}
        {unit(m, 'm', h > 0 || m > 0)}
        {unit(s, 's', digits.length > 0)}
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setFresh(true);
              onDigits(preset.digits);
            }}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors',
              digits === preset.digits ? 'bg-cream text-ink' : 'bg-card text-cream/70 hover:text-cream'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mb-6 grid max-w-xs grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((key) => (
          <button
            key={key}
            onClick={() => press(key)}
            disabled={key === 'back' && digits.length === 0}
            className="grid h-16 place-items-center rounded-2xl bg-card text-2xl font-black text-cream transition-colors hover:bg-background-tertiary active:bg-border disabled:opacity-30"
            aria-label={key === 'back' ? 'Delete digit' : key}
          >
            {key === 'back' ? <Delete className="h-6 w-6" /> : key}
          </button>
        ))}
      </div>

      <StartButton onClick={onStart} disabled={!canStart} />
    </div>
  );
}
