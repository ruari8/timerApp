import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Pencil, Play, Plus, Repeat } from 'lucide-react';
import { TimerPattern, calculatePatternDuration, formatDuration } from '@repo/shared';
import { AppShell } from '@/components/AppShell';
import { storage } from '@/lib/storage';

export const Route = createFileRoute('/routines')({
  component: RoutinesTab,
});

function RoutinesTab() {
  const [patterns, setPatterns] = useState<TimerPattern[] | null>(null);

  useEffect(() => {
    storage.loadPatterns().then(setPatterns);
  }, []);

  const newButton = (
    <Link
      to="/editor/$id"
      params={{ id: 'new' }}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-signal px-4 text-sm font-black text-ink transition-colors hover:bg-cream"
    >
      <Plus className="h-4 w-4" />
      New
    </Link>
  );

  return (
    <AppShell title="Routines" action={newButton}>
      <p className="mb-5 text-sm text-cream/50">
        Saved sequences of timed steps, like work/rest sets or game turns. Tap one to start it.
      </p>

      {patterns === null ? null : patterns.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center">
          <p className="text-lg font-black">No routines yet</p>
          <p className="mt-1 text-sm text-cream/50">Build one with timed steps that can repeat.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {patterns.map((pattern) => (
            <RoutineCard key={pattern.id} pattern={pattern} />
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function describe(pattern: TimerPattern) {
  const steps = pattern.blocks.flatMap((block) => block.segments);
  const names = steps.slice(0, 4).map((step) => `${step.name} ${formatDuration(step.durationSeconds)}`);
  const more = steps.length > 4 ? ` +${steps.length - 4}` : '';
  return names.join(' · ') + more;
}

function RoutineCard({ pattern }: { pattern: TimerPattern }) {
  const duration = calculatePatternDuration(pattern);
  const steps = pattern.blocks.flatMap((block) => block.segments);

  return (
    <li className="flex items-stretch overflow-hidden rounded-2xl bg-card">
      <Link
        to="/timer/$id"
        params={{ id: pattern.id }}
        search={{ autostart: true }}
        className="flex min-w-0 flex-1 items-center gap-4 p-4 transition-colors hover:bg-background-tertiary"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-signal text-ink">
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-black">{pattern.name}</span>
          <span className="block truncate text-sm text-cream/50">{describe(pattern)}</span>
          <span className="mt-2 flex h-1.5 overflow-hidden rounded-full">
            {steps.map((step) => (
              <span key={step.id} style={{ backgroundColor: step.color, flexGrow: step.durationSeconds }} />
            ))}
          </span>
        </span>
        <span className="shrink-0 text-right text-sm font-bold text-cream/70">
          {duration === -1 ? (
            <span className="inline-flex items-center gap-1">
              <Repeat className="h-4 w-4" /> Loops
            </span>
          ) : (
            formatDuration(duration)
          )}
        </span>
      </Link>
      <Link
        to="/editor/$id"
        params={{ id: pattern.id }}
        className="grid w-14 shrink-0 place-items-center border-l border-border text-cream/50 transition-colors hover:bg-background-tertiary hover:text-cream"
        aria-label={`Edit ${pattern.name}`}
      >
        <Pencil className="h-4 w-4" />
      </Link>
    </li>
  );
}
