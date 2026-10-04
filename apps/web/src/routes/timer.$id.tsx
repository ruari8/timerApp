import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { TimerPattern } from '@repo/shared';
import { TimerRunner } from '@/components/TimerRunner';
import { storage } from '@/lib/storage';
import { useSettings } from '@/lib/useSettings';

export const Route = createFileRoute('/timer/$id')({
  validateSearch: (search: Record<string, unknown>): { autostart?: boolean } => ({
    autostart: search.autostart === true || search.autostart === 'true' || search.autostart === 1 ? true : undefined,
  }),
  component: TimerPage,
});

function TimerPage() {
  const { id } = Route.useParams();
  const { autostart } = Route.useSearch();
  const settings = useSettings();
  const [pattern, setPattern] = useState<TimerPattern | null | undefined>(undefined);

  useEffect(() => {
    storage.loadPatterns().then((patterns) => setPattern(patterns.find((p) => p.id === id) ?? null));
  }, [id]);

  if (pattern === undefined || !settings) return <div className="min-h-[100dvh] bg-background" />;

  if (pattern === null) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl font-black text-cream">Routine not found</p>
        <Link to="/routines" className="font-bold text-signal hover:text-cream">
          Back to routines
        </Link>
      </div>
    );
  }

  return <TimerRunner pattern={pattern} settings={settings} autoStart={autostart} backTo="/routines" />;
}
