import { Infinity as InfinityIcon, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const stepButton =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background-tertiary text-cream/70 transition-colors hover:bg-border hover:text-cream disabled:opacity-30';

function NumberBox({
  value,
  onChange,
  label,
  pad,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  pad?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={pad ? String(value).padStart(2, '0') : String(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(-3);
        onChange(digits ? Number(digits) : 0);
      }}
      className="w-12 rounded-lg bg-transparent py-1 text-center font-mono text-xl font-black text-cream tabular-nums focus:bg-background-tertiary focus:outline-none"
    />
  );
}

// Minutes and seconds with −/+ nudges; value is in seconds
export function DurationField({
  value,
  onChange,
  step,
  min = 1,
  label,
}: {
  value: number;
  onChange: (seconds: number) => void;
  step?: number;
  min?: number;
  label: string;
}) {
  // Nudge size scales with the value so long steps don't need dozens of taps
  const nudge = step ?? (value >= 300 ? 60 : value >= 60 ? 15 : 5);
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  const set = (n: number) => onChange(Math.max(min, n));

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={stepButton} onClick={() => set(value - nudge)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex items-center">
        <NumberBox label={`${label} minutes`} value={mins} onChange={(m) => set(m * 60 + secs)} />
        <span className="font-mono text-xl font-black text-cream/40">:</span>
        <NumberBox label={`${label} seconds`} value={secs} pad onChange={(s) => set(mins * 60 + Math.min(59, s))} />
      </div>
      <button type="button" className={stepButton} onClick={() => set(value + nudge)} aria-label={`Increase ${label}`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// Repeat count with an optional "forever" toggle; -1 means forever
export function RepeatStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const forever = value === -1;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={stepButton}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={forever || value <= 1}
        aria-label={`Fewer ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      {forever ? (
        <span className="w-12 text-center font-mono text-xl font-black text-signal">∞</span>
      ) : (
        <NumberBox label={label} value={value} onChange={(n) => onChange(Math.max(1, n))} />
      )}
      <button
        type="button"
        className={stepButton}
        onClick={() => onChange(value + 1)}
        disabled={forever}
        aria-label={`More ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(forever ? 1 : -1)}
        aria-pressed={forever}
        title="Repeat forever"
        className={cn(
          'ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors',
          forever ? 'bg-signal text-ink' : 'bg-background-tertiary text-cream/50 hover:text-cream'
        )}
      >
        <InfinityIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
