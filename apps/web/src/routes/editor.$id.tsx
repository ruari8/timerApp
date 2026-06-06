import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
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
          <span className="text-sm text-neutral-500">
            {isNew ? 'New Timer' : 'Edit Timer'}
          </span>
          <button
            onClick={handleSave}
            className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Save
          </button>
        </div>
      </header>

      <main className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-500">Timer name</label>
              <input
                className="w-full bg-background-tertiary border border-border rounded-xl px-4 py-3 text-lg text-neutral-50 focus:outline-none focus:border-amber-400"
                value={pattern.name}
                onChange={(event) => updatePattern({ name: event.target.value })}
                placeholder="Timer name"
              />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Loop entire pattern
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PATTERN_REPEAT_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updatePattern({ repeatEntirePattern: value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                        pattern.repeatEntirePattern === value
                          ? 'bg-amber-500 text-background border-amber-400'
                          : 'bg-background-tertiary text-neutral-400 border-border hover:border-border-light'
                      )}
                    >
                      {value === -1 ? '∞' : value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-neutral-500">
                Total duration:{' '}
                <span className="text-neutral-200 font-semibold">
                  {isInfinite ? '∞' : formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-100">Blocks</h2>
                <p className="text-sm text-neutral-500">
                  Each block contains segments that play in sequence.
                </p>
              </div>
              <button
                onClick={addBlock}
                className="px-4 py-2 rounded-xl bg-background-tertiary border border-border text-neutral-200 hover:border-border-light"
              >
                + Add Block
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
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">Block {index + 1}</h3>
          <p className="text-sm text-neutral-500">Repeat count</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-background-tertiary border border-border rounded-lg px-3 py-2 text-neutral-200"
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
            className="text-sm text-neutral-400 hover:text-red-400"
          >
            Delete block
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
        className="w-full py-2 rounded-xl border border-border text-neutral-300 hover:border-border-light"
      >
        + Add Segment
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
    <div className="bg-background-tertiary border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Segment {index + 1}</p>
          <input
            className="mt-2 bg-transparent border-b border-border text-neutral-100 text-base focus:outline-none focus:border-amber-400"
            value={segment.name}
            onChange={(event) => onUpdate({ ...segment, name: event.target.value })}
          />
        </div>
        <button
          onClick={onDelete}
          className="text-sm text-neutral-400 hover:text-red-400"
        >
          Delete
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-neutral-500">
          Duration (seconds)
          <input
            type="number"
            min={1}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-neutral-100"
            value={segment.durationSeconds}
            onChange={(event) =>
              onUpdate({
                ...segment,
                durationSeconds: Math.max(1, Number(event.target.value || 1)),
              })
            }
          />
          <p className="text-xs text-neutral-600">
            {formatDuration(segment.durationSeconds)}
          </p>
        </label>

        <label className="space-y-2 text-sm text-neutral-500">
          End sound
          <select
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-neutral-100"
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
        <p className="text-sm text-neutral-500">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate({ ...segment, color })}
              aria-label={`Use segment color ${color}`}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-transform',
                segment.color === color ? 'border-neutral-100 scale-105' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
