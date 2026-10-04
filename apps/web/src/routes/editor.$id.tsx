import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Play, Plus, Trash2, X } from 'lucide-react';
import {
  TimerPattern,
  TimerBlock,
  TimerSegment,
  SEGMENT_COLORS,
  SOUND_OPTIONS,
  SoundKey,
  createDefaultPattern,
  createDefaultBlock,
  createDefaultSegment,
  calculatePatternDuration,
  formatDuration,
} from '@repo/shared';
import { DurationField, RepeatStepper } from '@/components/inputs';
import { storage } from '@/lib/storage';
import { playSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/editor/$id')({
  component: EditorPage,
});

const SOUND_KEYS = Object.keys(SOUND_OPTIONS) as SoundKey[];
const COLOR_OPTIONS = Object.values(SEGMENT_COLORS);

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const isNew = id === 'new';
  const [pattern, setPattern] = useState<TimerPattern | null>(null);
  const [exists, setExists] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    storage.loadPatterns().then((patterns) => {
      const found = isNew ? undefined : patterns.find((item) => item.id === id);
      setExists(Boolean(found));
      setPattern(found ?? { ...createDefaultPattern(), name: '' });
    });
  }, [id, isNew]);

  const totalDuration = useMemo(() => (pattern ? calculatePatternDuration(pattern) : 0), [pattern]);

  if (!pattern) return <div className="min-h-[100dvh] bg-background" />;

  const updatePattern = (updates: Partial<TimerPattern>) => setPattern({ ...pattern, ...updates });

  const updateBlock = (index: number, block: TimerBlock) =>
    updatePattern({ blocks: pattern.blocks.map((b, i) => (i === index ? block : b)) });

  const save = async () => {
    const saved = { ...pattern, name: pattern.name.trim() || 'Untitled routine' };
    await storage.savePattern(saved);
    return saved;
  };

  const handleSave = async () => {
    await save();
    navigate({ to: '/routines' });
  };

  const handleSaveAndStart = async () => {
    const saved = await save();
    navigate({ to: '/timer/$id', params: { id: saved.id }, search: { autostart: true } });
  };

  const handleDelete = async () => {
    await storage.deletePattern(pattern.id);
    navigate({ to: '/routines' });
  };

  const steps = pattern.blocks.flatMap((block) => block.segments);
  const multipleSets = pattern.blocks.length > 1;

  return (
    <div className="min-h-[100dvh] bg-background text-cream">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <Link
            to="/routines"
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-cream/70 transition-colors hover:text-cream"
            aria-label="Back to routines"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-bold text-cream/60">{exists ? 'Edit routine' : 'New routine'}</span>
          <button
            onClick={handleSave}
            className="h-10 rounded-full bg-card px-4 text-sm font-black text-cream transition-colors hover:bg-background-tertiary"
          >
            Save
          </button>
        </div>
      </header>

      <main className="px-4 pb-32 pt-5">
        <div className="mx-auto max-w-xl space-y-5">
          <input
            className="w-full rounded-2xl bg-card px-4 py-4 text-2xl font-black text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-aqua"
            value={pattern.name}
            onChange={(event) => updatePattern({ name: event.target.value })}
            placeholder="Routine name"
            autoFocus={isNew}
          />

          <div>
            <div className="flex h-2 overflow-hidden rounded-full">
              {steps.map((step) => (
                <span key={step.id} style={{ backgroundColor: step.color, flexGrow: step.durationSeconds }} />
              ))}
            </div>
            <p className="mt-2 text-sm font-bold text-cream/50">
              {totalDuration === -1 ? 'Repeats until you stop it' : `Total ${formatDuration(totalDuration)}`}
            </p>
          </div>

          {pattern.blocks.map((block, blockIndex) => (
            <SetCard
              key={block.id}
              block={block}
              title={multipleSets ? `Set ${blockIndex + 1}` : 'Steps'}
              onUpdate={(updated) => updateBlock(blockIndex, updated)}
              onDelete={
                multipleSets
                  ? () => {
                      const blocks = pattern.blocks.filter((_, i) => i !== blockIndex);
                      // The whole-routine repeat is only shown with several sets, so don't leave it hidden and set
                      updatePattern({ blocks, repeatEntirePattern: blocks.length > 1 ? pattern.repeatEntirePattern : 1 });
                    }
                  : undefined
              }
            />
          ))}

          <button
            onClick={() => updatePattern({ blocks: [...pattern.blocks, createDefaultBlock()] })}
            className="w-full rounded-2xl border border-dashed border-border-light py-4 text-sm font-bold text-cream/60 transition-colors hover:border-aqua hover:text-aqua"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add another set
            </span>
            <span className="mt-0.5 block text-xs font-normal text-cream/40">
              e.g. a warm-up, a cooldown, or a long break after the main set
            </span>
          </button>

          {multipleSets ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3">
              <div>
                <p className="font-black">Repeat whole routine</p>
                <p className="text-xs text-cream/40">Runs every set again from the top</p>
              </div>
              <RepeatStepper
                label="routine repeats"
                value={pattern.repeatEntirePattern}
                onChange={(repeatEntirePattern) => updatePattern({ repeatEntirePattern })}
              />
            </div>
          ) : null}

          {exists ? (
            <div className="pt-4">
              {confirmDelete ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4">
                  <p className="font-bold">Delete this routine?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="rounded-full px-4 py-2 text-sm font-bold text-cream/60">
                      Cancel
                    </button>
                    <button onClick={handleDelete} className="rounded-full bg-ember px-4 py-2 text-sm font-black text-ink">
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="mx-auto flex items-center gap-2 text-sm font-bold text-cream/40 transition-colors hover:text-ember"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete routine
                </button>
              )}
            </div>
          ) : null}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          onClick={handleSaveAndStart}
          className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-signal py-4 text-lg font-black text-ink transition-colors hover:bg-cream"
        >
          <Play className="h-5 w-5" fill="currentColor" />
          Save & start
        </button>
      </div>
    </div>
  );
}

function SetCard({
  block,
  title,
  onUpdate,
  onDelete,
}: {
  block: TimerBlock;
  title: string;
  onUpdate: (block: TimerBlock) => void;
  onDelete?: () => void;
}) {
  const update = (updates: Partial<TimerBlock>) => onUpdate({ ...block, ...updates });

  const addStep = () => {
    const color = COLOR_OPTIONS[block.segments.length % COLOR_OPTIONS.length];
    update({ segments: [...block.segments, createDefaultSegment(`Step ${block.segments.length + 1}`, color)] });
  };

  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-black">{title}</h2>
        {onDelete ? (
          <button onClick={onDelete} className="grid h-9 w-9 place-items-center rounded-full text-cream/40 hover:text-ember" aria-label={`Remove ${title}`}>
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        {block.segments.map((segment, i) => (
          <StepRow
            key={segment.id}
            segment={segment}
            onUpdate={(updated) => update({ segments: block.segments.map((s, j) => (j === i ? updated : s)) })}
            onDelete={
              block.segments.length > 1
                ? () => update({ segments: block.segments.filter((_, j) => j !== i) })
                : undefined
            }
          />
        ))}
      </div>

      <button
        onClick={addStep}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-cream/60 transition-colors hover:bg-background-tertiary hover:text-cream"
      >
        <Plus className="h-4 w-4" />
        Add step
      </button>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="font-bold">Repeat</p>
          <p className="text-xs text-cream/40">
            {block.repeatCount === -1
              ? 'Loops until you stop it'
              : block.repeatCount === 1
                ? 'Plays once'
                : `Plays these steps ${block.repeatCount} times`}
          </p>
        </div>
        <RepeatStepper label="repeats" value={block.repeatCount} onChange={(repeatCount) => update({ repeatCount })} />
      </div>
    </section>
  );
}

function StepRow({
  segment,
  onUpdate,
  onDelete,
}: {
  segment: TimerSegment;
  onUpdate: (segment: TimerSegment) => void;
  onDelete?: () => void;
}) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="rounded-xl bg-background-tertiary p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="h-7 w-7 shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-cream/40"
          style={{ backgroundColor: segment.color }}
          aria-label="Color and sound"
          aria-expanded={showOptions}
        />
        <input
          className="min-w-0 flex-1 bg-transparent py-1 font-black text-cream placeholder:text-cream/30 focus:outline-none"
          value={segment.name}
          placeholder="Step name"
          onChange={(event) => onUpdate({ ...segment, name: event.target.value })}
        />
        {onDelete ? (
          <button onClick={onDelete} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-cream/35 hover:text-ember" aria-label={`Remove ${segment.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-xs font-bold text-cream/40 hover:text-cream/70"
        >
          {showOptions ? 'Hide options' : 'Color & sound'}
        </button>
        <DurationField label={segment.name || 'step'} value={segment.durationSeconds} onChange={(durationSeconds) => onUpdate({ ...segment, durationSeconds })} />
      </div>

      {showOptions ? (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onUpdate({ ...segment, color })}
                aria-label={`Color ${color}`}
                className={cn('h-8 w-8 rounded-full ring-2 transition', segment.color === color ? 'ring-cream' : 'ring-transparent')}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <label className="flex items-center justify-between gap-3 text-sm font-bold text-cream/60">
            Sound when it ends
            <select
              className="rounded-lg bg-background px-3 py-2 text-cream"
              value={segment.endSound ?? ''}
              onChange={(event) => {
                const endSound = (event.target.value || undefined) as SoundKey | undefined;
                if (endSound) playSound(endSound, false);
                onUpdate({ ...segment, endSound });
              }}
            >
              <option value="">Default</option>
              {SOUND_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SOUND_OPTIONS[key].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
