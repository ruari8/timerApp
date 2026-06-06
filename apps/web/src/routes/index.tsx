import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, Play, Edit, TimerReset } from 'lucide-react';
import {
  TimerPattern,
  formatDuration,
  calculatePatternDuration,
} from '@repo/shared';
import { storage } from '@/lib/storage';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [patterns, setPatterns] = useState<TimerPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const data = await storage.loadPatterns();
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patternId: string) => {
    await storage.deletePattern(patternId);
    loadPatterns();
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-background text-cream">
      <header className="border-b border-border bg-background/90 px-5 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-aqua">Pattern Timer</p>
            <h1 className="mt-1 text-4xl font-black text-cream sm:text-5xl">
              Timer Library
            </h1>
            <p className="mt-2 max-w-xl text-sm text-cream/55">
              Programmable loops for gym intervals, table rules, and focus rounds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/editor/$id"
              params={{ id: 'new' }}
              className="hidden items-center gap-2 rounded-lg border border-signal bg-signal px-4 py-3 text-sm font-black text-ink transition-colors hover:bg-cream sm:flex"
            >
              <Plus className="h-4 w-4" />
              New Timer
            </Link>
            <Link
              to="/settings"
              className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-aqua hover:text-aqua"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="px-5 py-8 pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold uppercase text-cream/45">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <TimerReset className="h-4 w-4 text-signal" />
              {patterns.length} pattern{patterns.length !== 1 ? 's' : ''}
            </span>
            <span className="rounded-lg border border-border bg-card px-3 py-2">
              Local storage
            </span>
          </div>

          <Link
            to="/editor/$id"
            params={{ id: 'new' }}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg border border-signal bg-signal py-4 font-black text-ink transition-colors hover:bg-cream sm:hidden"
          >
            <Plus className="h-5 w-5" />
            New Timer
          </Link>

          <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-cream/45">
              Loading...
            </div>
          ) : patterns.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center md:col-span-2">
              <p className="text-xl font-black text-cream">No timers yet</p>
              <p className="mt-2 text-cream/50">Create a first pattern to seed the library.</p>
            </div>
          ) : (
            patterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                showDeleteConfirm={deleteConfirm === pattern.id}
                onDeleteClick={() => setDeleteConfirm(pattern.id)}
                onDeleteConfirm={() => handleDelete(pattern.id)}
                onDeleteCancel={() => setDeleteConfirm(null)}
              />
            ))
          )}
          </div>
        </div>
      </main>

    </div>
  );
}

interface PatternCardProps {
  pattern: TimerPattern;
  showDeleteConfirm: boolean;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function PatternCard({
  pattern,
  showDeleteConfirm,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: PatternCardProps) {
  const duration = calculatePatternDuration(pattern);
  const isInfinite = duration === -1;

  // Get preview colors from segments
  const previewColors = pattern.blocks
    .flatMap((block) => block.segments.map((seg) => seg.color))
    .slice(0, 5);

  // Get segment preview text
  const segmentNames = pattern.blocks
    .flatMap((block) => block.segments.map((seg) => seg.name))
    .slice(0, 3)
    .join(' → ');

  const segmentCount = pattern.blocks.reduce(
    (sum, block) => sum + block.segments.length,
    0
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card panel-shadow transition-colors hover:border-aqua">
      <div className="flex h-1">
        {previewColors.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-2xl font-black text-cream">
              {pattern.name}
            </h3>
            <p className="mt-2 truncate font-mono text-sm text-cream/50">{segmentNames}</p>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/timer/$id"
              params={{ id: pattern.id }}
              className="rounded-lg border border-border bg-background-tertiary p-2 text-signal transition-colors hover:border-signal hover:bg-signal hover:text-ink"
              aria-label={`Start ${pattern.name}`}
              title="Start"
            >
              <Play className="h-4 w-4" fill="currentColor" />
            </Link>
            <Link
              to="/editor/$id"
              params={{ id: pattern.id }}
              className="rounded-lg border border-border bg-background-tertiary p-2 text-cream/60 transition-colors hover:border-aqua hover:text-aqua"
              aria-label={`Edit ${pattern.name}`}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={onDeleteClick}
              className="rounded-lg border border-border bg-background-tertiary p-2 text-cream/60 transition-colors hover:border-ember hover:text-ember"
              aria-label={`Delete ${pattern.name}`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-xs font-bold uppercase">
          <span className="rounded-lg border border-border bg-background px-3 py-2 text-signal">
            {isInfinite ? '∞ Repeating' : formatDuration(duration)}
          </span>
          <span className="rounded-lg border border-border bg-background px-3 py-2 text-cream/50">
            {pattern.blocks.length} block{pattern.blocks.length !== 1 ? 's' : ''}
          </span>
          <span className="rounded-lg border border-border bg-background px-3 py-2 text-cream/50">
            {segmentCount} segment{segmentCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/95 p-4 backdrop-blur">
          <div className="text-center">
            <p className="mb-4 font-black text-cream">Delete "{pattern.name}"?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onDeleteCancel}
                className="rounded-lg border border-border bg-background-tertiary px-4 py-2 font-bold text-cream/70 transition-colors hover:text-cream"
              >
                Cancel
              </button>
              <button
                onClick={onDeleteConfirm}
                className="rounded-lg border border-ember bg-ember px-4 py-2 font-black text-ink transition-colors hover:bg-cream"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
