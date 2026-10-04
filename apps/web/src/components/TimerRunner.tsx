import { useEffect, useMemo, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Pause, Play, Plus, RotateCcw, SkipForward, X } from 'lucide-react';
import {
  AppSettings,
  TimerPattern,
  formatDuration,
  formatTime,
  getCurrentSegment,
  getNextPosition,
  getRemainingAfter,
  isSimpleCountdown,
} from '@repo/shared';
import { useTimerRunner } from '@/lib/useTimerRunner';
import { useWakeLock } from '@/lib/useWakeLock';
import { playComplete } from '@/lib/audio';
import { cn } from '@/lib/utils';

interface TimerRunnerProps {
  pattern: TimerPattern;
  settings: AppSettings;
  autoStart?: boolean;
  backTo: '/' | '/routines';
}

export function TimerRunner({ pattern, settings, autoStart, backTo }: TimerRunnerProps) {
  const runner = useTimerRunner(pattern, settings);
  const { status, pos, segment, remainingMs, stepTotalMs, elapsedMs } = runner;
  const simple = isSimpleCountdown(pattern);
  const running = status === 'running';
  const done = status === 'done';

  const runnerRef = useRef(runner);
  runnerRef.current = runner;

  useWakeLock(running);

  useEffect(() => {
    if (autoStart) runnerRef.current.start();
  }, [autoStart]);

  // Keep ringing when finished until the user interacts, like a kitchen timer
  useEffect(() => {
    if (!done) return;
    let rings = 0;
    const id = window.setInterval(() => {
      rings += 1;
      if (rings > 8) window.clearInterval(id);
      else playComplete(settings.hapticFeedback);
    }, 2500);
    const stop = () => window.clearInterval(id);
    window.addEventListener('pointerdown', stop, { once: true });
    window.addEventListener('keydown', stop, { once: true });
    return () => {
      stop();
      window.removeEventListener('pointerdown', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [done, settings.hapticFeedback]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    const label = done ? 'Done' : `${formatTime(remainingSeconds)} · ${segment?.name ?? 'Timer'}`;
    document.title = label;
    return () => {
      document.title = 'Pattern Timer';
    };
  }, [done, remainingSeconds, segment?.name]);

  // Keyboard: space = start/pause, → = next step, r = restart
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const r = runnerRef.current;
      if (e.code === 'Space') {
        e.preventDefault();
        r.toggle();
      } else if (e.key === 'ArrowRight') r.next();
      else if (e.key === 'r' || e.key === 'R') r.reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const upNext = useMemo(() => {
    if (simple) return null;
    const next = getNextPosition(pattern, pos.blockIndex, pos.segmentIndex, pos.blockRepeat, pos.patternRepeat);
    if (next.isComplete) return null;
    return getCurrentSegment(pattern, next.blockIndex, next.segmentIndex);
  }, [pattern, pos, simple]);

  const totalLeftAfterStep = useMemo(
    () => (simple ? 0 : getRemainingAfter(pattern, pos.blockIndex, pos.segmentIndex, pos.blockRepeat, pos.patternRepeat)),
    [pattern, pos, simple]
  );

  const block = pattern.blocks[pos.blockIndex];
  const heading = done
    ? 'Done'
    : !simple
      ? segment?.name
      : status === 'paused'
        ? 'Paused'
        : status === 'ready'
          ? 'Ready'
          : '\u00a0';
  const progress = done ? 1 : 1 - remainingMs / stepTotalMs;
  const color = done ? '#3F6212' : segment?.color ?? '#0E7490';

  const roundLabel =
    block && block.repeatCount !== 1
      ? block.repeatCount === -1
        ? `Round ${pos.blockRepeat}`
        : `Round ${pos.blockRepeat} of ${block.repeatCount}`
      : null;
  const cycleLabel =
    pattern.repeatEntirePattern !== 1
      ? pattern.repeatEntirePattern === -1
        ? `Cycle ${pos.patternRepeat}`
        : `Cycle ${pos.patternRepeat} of ${pattern.repeatEntirePattern}`
      : null;
  const sectionLabel = pattern.blocks.length > 1 ? `Part ${pos.blockIndex + 1} of ${pattern.blocks.length}` : null;
  const context = [sectionLabel, roundLabel, cycleLabel].filter(Boolean).join(' · ');

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden text-white transition-colors duration-300"
      style={{ backgroundColor: color }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/55" />

      <header className="relative z-10 flex items-center gap-3 px-4 pt-4">
        <Link
          to={backTo}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/30 text-white/80 transition-colors hover:bg-black/50 hover:text-white"
          aria-label="Close timer"
        >
          <X className="h-5 w-5" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-bold text-white/70">{pattern.name}</p>
        <div className="w-11 shrink-0" />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-2xl font-black uppercase tracking-wide text-white/90 sm:text-3xl">
          {heading}
        </p>
        {context && !done ? <p className="mt-2 text-sm font-bold text-white/60">{context}</p> : null}

        <p
          className={cn(
            'timer-font mt-4 font-mono font-black leading-none tabular-nums',
            remainingSeconds >= 3600 ? 'text-[clamp(3.5rem,17vw,10rem)]' : 'text-[clamp(5rem,26vw,13rem)]',
            status === 'paused' && 'animate-pulse'
          )}
        >
          {done ? formatTime(Math.round(elapsedMs / 1000)) : formatTime(remainingSeconds)}
        </p>

        <div className="mt-6 h-2 w-[min(80vw,34rem)] overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white/90" style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }} />
        </div>

        <div className="mt-5 min-h-[1.5rem] text-sm font-bold text-white/65">
          {done ? (
            <span>Total time {formatDuration(Math.round(elapsedMs / 1000))}</span>
          ) : upNext ? (
            <span>
              Up next: <span className="text-white">{upNext.name}</span> · {formatDuration(upNext.durationSeconds)}
              {totalLeftAfterStep > 0 ? (
                <span className="text-white/50"> · {formatTime(totalLeftAfterStep + remainingSeconds)} left overall</span>
              ) : null}
            </span>
          ) : !simple && status !== 'ready' ? (
            <span>Last step</span>
          ) : null}
        </div>
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-5 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {!done ? (
          <div className="flex gap-2">
            <button
              onClick={() => runner.addTime(60)}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white/85 transition-colors hover:bg-white/25"
            >
              <Plus className="h-4 w-4" /> 1 min
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-6">
          {done ? (
            <div className="h-14 w-14" />
          ) : (
            <RoundButton onClick={runner.reset} label="Restart">
              <RotateCcw className="h-6 w-6" />
            </RoundButton>
          )}

          <button
            onClick={runner.toggle}
            className="grid h-24 w-24 place-items-center rounded-full bg-white text-black shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
            aria-label={running ? 'Pause' : done ? 'Run again' : 'Start'}
          >
            {running ? (
              <Pause className="h-10 w-10" fill="currentColor" />
            ) : done ? (
              <RotateCcw className="h-10 w-10" />
            ) : (
              <Play className="ml-1 h-10 w-10" fill="currentColor" />
            )}
          </button>

          {simple || done ? (
            <div className="h-14 w-14" />
          ) : (
            <RoundButton onClick={runner.next} label="Next step">
              <SkipForward className="h-6 w-6" />
            </RoundButton>
          )}
        </div>

        {!done && !simple ? (
          <p className="text-xs font-bold text-white/45">Elapsed {formatTime(Math.floor(elapsedMs / 1000))}</p>
        ) : null}
      </footer>
    </div>
  );
}

function RoundButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white/85 transition-colors hover:bg-white/25 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
