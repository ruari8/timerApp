import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { createCountdownPattern, createIntervalPattern } from '@repo/shared';
import { TimerRunner } from '@/components/TimerRunner';
import { useSettings } from '@/lib/useSettings';

// Quick timers from the Timer tab. Everything lives in the URL so a refresh keeps the setup.
interface RunSearch {
  s?: number;
  work?: number;
  rest?: number;
  rounds?: number;
}

const toInt = (value: unknown) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : undefined;
};

export const Route = createFileRoute('/run')({
  validateSearch: (search: Record<string, unknown>): RunSearch => ({
    s: toInt(search.s),
    work: toInt(search.work),
    rest: toInt(search.rest),
    rounds: toInt(search.rounds),
  }),
  component: RunPage,
});

function RunPage() {
  const { s, work, rest, rounds } = Route.useSearch();
  const settings = useSettings();

  const pattern = useMemo(() => {
    if (s && s > 0) return createCountdownPattern(s);
    return createIntervalPattern(Math.max(1, work ?? 40), Math.max(0, rest ?? 20), rounds === -1 ? -1 : Math.max(1, rounds ?? 8));
  }, [s, work, rest, rounds]);

  if (!settings) return <div className="min-h-[100dvh] bg-background" />;
  return <TimerRunner key={pattern.id} pattern={pattern} settings={settings} autoStart backTo="/" />;
}
