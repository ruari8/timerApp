import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { loadPref, savePref } from '@/lib/prefs';
import { useWakeLock } from '@/lib/useWakeLock';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/stopwatch')({
  component: StopwatchTab,
});

// Persisted so the stopwatch keeps going across reloads and tab switches
interface StopwatchState {
  startedAt: number | null; // set while running
  accumulatedMs: number; // time banked before startedAt
  laps: number[]; // total elapsed at each lap press
}

const KEY = 'stopwatch_state';
const EMPTY: StopwatchState = { startedAt: null, accumulatedMs: 0, laps: [] };

function formatStopwatch(ms: number) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60) % 60;
  const h = Math.floor(totalS / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { main: h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`, cs: pad(cs) };
}

function StopwatchTab() {
  const [sw, setSw] = useState<StopwatchState>(() => loadPref(KEY, EMPTY));
  const [now, setNow] = useState(() => Date.now());
  const running = sw.startedAt !== null;

  useWakeLock(running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 50);
    return () => window.clearInterval(id);
  }, [running]);

  const commit = (next: StopwatchState) => {
    setSw(next);
    savePref(KEY, next);
  };

  const elapsed = sw.accumulatedMs + (sw.startedAt !== null ? now - sw.startedAt : 0);

  const toggle = () => {
    const t = Date.now();
    setNow(t);
    if (running) commit({ ...sw, startedAt: null, accumulatedMs: sw.accumulatedMs + (t - sw.startedAt!) });
    else commit({ ...sw, startedAt: t });
  };

  const lapOrReset = () => {
    if (running) commit({ ...sw, laps: [...sw.laps, elapsed] });
    else commit(EMPTY);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'l' || e.key === 'L') lapOrReset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { main, cs } = formatStopwatch(elapsed);
  const splits = sw.laps.map((total, i) => total - (sw.laps[i - 1] ?? 0));
  const currentSplit = elapsed - (sw.laps[sw.laps.length - 1] ?? 0);
  const fastest = splits.length > 1 ? Math.min(...splits) : null;
  const slowest = splits.length > 1 ? Math.max(...splits) : null;

  return (
    <AppShell title="Stopwatch">
      <div className="py-10 text-center font-mono font-black tabular-nums">
        <span className="text-[clamp(4rem,20vw,7rem)] leading-none">{main}</span>
        <span className="text-[clamp(2rem,9vw,3rem)] text-cream/50">.{cs}</span>
      </div>

      <div className="mb-8 flex items-center justify-center gap-6">
        <button
          onClick={lapOrReset}
          disabled={!running && elapsed === 0}
          className="h-20 w-20 rounded-full bg-card text-base font-black text-cream transition-colors hover:bg-background-tertiary disabled:opacity-30"
        >
          {running || elapsed === 0 ? 'Lap' : 'Reset'}
        </button>
        <button
          onClick={toggle}
          className={cn(
            'h-20 w-20 rounded-full text-base font-black transition-colors',
            running ? 'bg-ember text-ink hover:bg-cream' : 'bg-signal text-ink hover:bg-cream'
          )}
        >
          {running ? 'Stop' : elapsed > 0 ? 'Resume' : 'Start'}
        </button>
      </div>

      {sw.laps.length > 0 ? (
        <ol className="divide-y divide-border rounded-2xl bg-card px-4">
          <LapRow label={`Lap ${sw.laps.length + 1}`} ms={currentSplit} />
          {splits
            .map((split, i) => (
              <LapRow
                key={i}
                label={`Lap ${i + 1}`}
                ms={split}
                tone={split === fastest ? 'fast' : split === slowest ? 'slow' : undefined}
              />
            ))
            .reverse()}
        </ol>
      ) : null}
    </AppShell>
  );
}

function LapRow({ label, ms, tone }: { label: string; ms: number; tone?: 'fast' | 'slow' }) {
  const { main, cs } = formatStopwatch(ms);
  return (
    <li
      className={cn(
        'flex justify-between py-3 font-bold',
        tone === 'fast' ? 'text-signal' : tone === 'slow' ? 'text-ember' : 'text-cream/80'
      )}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums">
        {main}.{cs}
      </span>
    </li>
  );
}
