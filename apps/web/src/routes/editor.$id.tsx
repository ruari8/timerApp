import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import {
  TimerPattern,
  TimerBlock,
  TimerSegment,
  SEGMENT_COLORS,
  SOUND_OPTIONS,
  createDefaultPattern,
  createDefaultBlock,
  createDefaultSegment,
  calculatePatternDuration,
  formatDuration,
} from '@repo/shared';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/editor/$id')({
  component: EditorPage,
});

const PATTERN_REPEAT_OPTIONS = [1, 2, 3, 4, 5, -1];
const BLOCK_REPEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, -1];
const SOUND_KEYS = Object.keys(SOUND_OPTIONS) as Array<keyof typeof SOUND_OPTIONS>;
const COLOR_OPTIONS = Object.values(SEGMENT_COLORS);

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const [pattern, setPattern] = useState<TimerPattern>(() => createDefaultPattern());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isNew = id === 'new';

  useEffect(() => {
    const load = async () => {
      try {
        const patterns = await storage.loadPatterns();
        if (!isNew) {
          const found = patterns.find((item) => item.id === id);
          if (found) {
            setPattern(found);
          } else {
            setPattern(createDefaultPattern());
          }
        } else {
          setPattern(createDefaultPattern());
        }
      } catch (err) {
        console.error('Failed to load pattern', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isNew]);

  const totalDuration = useMemo(() => calculatePatternDuration(pattern), [pattern]);
  const isInfinite = totalDuration === -1;

  const updatePattern = (updates: Partial<TimerPattern>) => {
    setPattern((prev) => ({ ...prev, ...updates }));
  };

  const updateBlock = (index: number, block: TimerBlock) => {
    const blocks = [...pattern.blocks];
    blocks[index] = block;
    updatePattern({ blocks });
  };

  const deleteBlock = (index: number) => {
    if (pattern.blocks.length === 1) return;
    updatePattern({ blocks: pattern.blocks.filter((_, i) => i !== index) });
  };

  const addBlock = () => {
    updatePattern({ blocks: [...pattern.blocks, createDefaultBlock()] });
  };

  const handleSave = async () => {
    const trimmed = pattern.name.trim();
    if (!trimmed) {
      setError('Please give the timer a name.');
      return;
    }

    setError(null);
    await storage.savePattern({ ...pattern, name: trimmed });
    navigate({ to: '/' });
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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-cream/65 transition-colors hover:border-aqua hover:text-aqua"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-sm font-bold uppercase text-cream/45">
            {isNew ? 'New Timer' : 'Edit Timer'}
          </span>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg border border-signal bg-signal px-3 py-2 text-sm font-black text-ink transition-colors hover:bg-cream"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </header>

      <main className="px-5 py-8 pb-24">
        <div className="mx-auto max-w-4xl space-y-8">
          <section className="space-y-4 rounded-lg border border-border bg-card p-6 panel-shadow">
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/50">Timer name</label>
              <input
                className="w-full rounded-lg border border-border bg-background-tertiary px-4 py-3 text-lg font-black text-cream focus:border-aqua focus:outline-none"
                value={pattern.name}
                onChange={(event) => updatePattern({ name: event.target.value })}
                placeholder="Timer name"
              />
              {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-cream/45">
                  Loop entire pattern
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PATTERN_REPEAT_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updatePattern({ repeatEntirePattern: value })}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm font-black transition-colors',
                        pattern.repeatEntirePattern === value
                          ? 'border-signal bg-signal text-ink'
                          : 'border-border bg-background-tertiary text-cream/55 hover:border-aqua hover:text-aqua'
                      )}
                    >
                      {value === -1 ? '∞' : value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm font-bold text-cream/45">
                Total duration:{' '}
                <span className="font-black text-signal">
                  {isInfinite ? '∞' : formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-cream">Blocks</h2>
                <p className="text-sm text-cream/50">
                  Each block contains segments that play in sequence.
                </p>
              </div>
              <button
                onClick={addBlock}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-black text-cream transition-colors hover:border-aqua hover:text-aqua"
              >
                <Plus className="h-4 w-4" />
                Add Block
              </button>
            </div>

            <div className="space-y-6">
              {pattern.blocks.map((block, blockIndex) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  index={blockIndex}
                  onUpdate={(updated) => updateBlock(blockIndex, updated)}
                  onDelete={() => deleteBlock(blockIndex)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

type BlockCardProps = {
  block: TimerBlock;
  index: number;
  onUpdate: (block: TimerBlock) => void;
  onDelete: () => void;
};

function BlockCard({ block, index, onUpdate, onDelete }: BlockCardProps) {
  const updateBlock = (updates: Partial<TimerBlock>) => {
    onUpdate({ ...block, ...updates });
  };

  const updateSegment = (segmentIndex: number, segment: TimerSegment) => {
    const segments = [...block.segments];
    segments[segmentIndex] = segment;
    updateBlock({ segments });
  };

  const deleteSegment = (segmentIndex: number) => {
    if (block.segments.length === 1) return;
    updateBlock({ segments: block.segments.filter((_, i) => i !== segmentIndex) });
  };

  const addSegment = () => {
    const color = COLOR_OPTIONS[block.segments.length % COLOR_OPTIONS.length];
    updateBlock({
      segments: [...block.segments, createDefaultSegment('New Segment', color)],
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6 panel-shadow">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-cream">Block {index + 1}</h3>
          <p className="text-sm text-cream/45">Repeat count</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-border bg-background-tertiary px-3 py-2 font-bold text-cream"
            value={block.repeatCount}
            onChange={(event) => updateBlock({ repeatCount: Number(event.target.value) })}
          >
            {BLOCK_REPEAT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value === -1 ? '∞ (infinite)' : `×${value}`}
              </option>
            ))}
          </select>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-cream/55 transition-colors hover:border-ember hover:text-ember"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {block.segments.map((segment, segmentIndex) => (
          <SegmentCard
            key={segment.id}
            segment={segment}
            index={segmentIndex}
            onUpdate={(updated) => updateSegment(segmentIndex, updated)}
            onDelete={() => deleteSegment(segmentIndex)}
          />
        ))}
      </div>

      <button
        onClick={addSegment}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 font-black text-cream/70 transition-colors hover:border-aqua hover:text-aqua"
      >
        <Plus className="h-4 w-4" />
        Add Segment
      </button>
    </div>
  );
}

type SegmentCardProps = {
  segment: TimerSegment;
  index: number;
  onUpdate: (segment: TimerSegment) => void;
  onDelete: () => void;
};

function SegmentCard({ segment, index, onUpdate, onDelete }: SegmentCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background-tertiary p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-cream/45">Segment {index + 1}</p>
          <input
            className="mt-2 border-b border-border bg-transparent text-base font-black text-cream focus:border-aqua focus:outline-none"
            value={segment.name}
            onChange={(event) => onUpdate({ ...segment, name: event.target.value })}
          />
        </div>
        <button
          onClick={onDelete}
          className="text-sm font-bold text-cream/50 transition-colors hover:text-ember"
        >
          Delete
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-cream/50">
          Duration (seconds)
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-cream"
            value={segment.durationSeconds}
            onChange={(event) =>
              onUpdate({
                ...segment,
                durationSeconds: Math.max(1, Number(event.target.value || 1)),
              })
            }
          />
          <p className="text-xs text-cream/35">
            {formatDuration(segment.durationSeconds)}
          </p>
        </label>

        <label className="space-y-2 text-sm font-bold text-cream/50">
          End sound
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-cream"
            value={segment.endSound ?? 'bell'}
            onChange={(event) => onUpdate({ ...segment, endSound: event.target.value as keyof typeof SOUND_OPTIONS })}
          >
            {SOUND_KEYS.map((key) => (
              <option key={key} value={key}>
                {SOUND_OPTIONS[key].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-cream/50">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate({ ...segment, color })}
              aria-label={`Use segment color ${color}`}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-transform',
                segment.color === color ? 'border-cream scale-105' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
