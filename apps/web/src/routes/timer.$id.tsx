import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import {
  TimerPattern,
  TimerState,
  AppSettings,
  DEFAULT_SETTINGS,
  formatTime,
  getCurrentSegment,
  getNextPosition,
} from '@repo/shared';
import { storage } from '@/lib/storage';
import { playSound, playTick, playComplete } from '@/lib/audio';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/timer/$id')({
  component: TimerPage,
});

function TimerPage() {
  const { id } = Route.useParams();
  const [pattern, setPattern] = useState<TimerPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<TimerState | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const stopTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Load pattern and settings
  useEffect(() => {
    const load = async () => {
      try {
        const [patterns, loadedSettings] = await Promise.all([
          storage.loadPatterns(),
          storage.loadSettings(),
        ]);
        const found = patterns.find((p) => p.id === id);
        if (found) {
          setPattern(found);
          setState({
            isRunning: false,
            isPaused: false,
            currentBlockIndex: 0,
            currentSegmentIndex: 0,
            currentBlockRepeat: 1,
            currentPatternRepeat: 1,
            remainingSeconds: found.blocks[0]?.segments[0]?.durationSeconds || 60,
            totalElapsedSeconds: 0,
          });
        }
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimerInterval();
    };
  }, [stopTimerInterval]);

  const currentSegment = pattern && state
    ? getCurrentSegment(pattern, state.currentBlockIndex, state.currentSegmentIndex)
    : null;

  const tick = useCallback(() => {
    if (!pattern) return;

    setState((prev) => {
      if (!prev) return prev;

      if (prev.remainingSeconds <= 1) {
        // Play segment end sound
        const currentSeg = getCurrentSegment(pattern, prev.currentBlockIndex, prev.currentSegmentIndex);
        const soundToPlay = currentSeg?.endSound || settings.defaultEndSound;
        playSound(soundToPlay, settings.hapticFeedback);

        const nextPos = getNextPosition(
          pattern,
          prev.currentBlockIndex,
          prev.currentSegmentIndex,
          prev.currentBlockRepeat,
          prev.currentPatternRepeat
        );

        if (nextPos.isComplete) {
          playComplete(settings.hapticFeedback);
          setIsComplete(true);
          stopTimerInterval();
          return {
            ...prev,
            isRunning: false,
            remainingSeconds: 0,
          };
        }

        const nextSegment = getCurrentSegment(
          pattern,
          nextPos.blockIndex,
          nextPos.segmentIndex
        );

        return {
          ...prev,
          currentBlockIndex: nextPos.blockIndex,
          currentSegmentIndex: nextPos.segmentIndex,
          currentBlockRepeat: nextPos.blockRepeat,
          currentPatternRepeat: nextPos.patternRepeat,
          remainingSeconds: nextSegment?.durationSeconds || 60,
          totalElapsedSeconds: prev.totalElapsedSeconds + 1,
        };
      }

      // Tick sound at 4 seconds remaining
      if (prev.remainingSeconds === 4) {
        playTick(settings.hapticFeedback);
      }

      return {
        ...prev,
        remainingSeconds: prev.remainingSeconds - 1,
        totalElapsedSeconds: prev.totalElapsedSeconds + 1,
      };
    });
  }, [pattern, settings.defaultEndSound, settings.hapticFeedback, stopTimerInterval]);

  const toggleTimer = () => {
    if (!state || !pattern) return;

    if (isComplete) {
      resetTimer();
      return;
    }

    if (state.isRunning) {
      stopTimerInterval();
      setState((prev) => (prev ? { ...prev, isPaused: true, isRunning: false } : prev));
    } else {
      stopTimerInterval();
      intervalRef.current = window.setInterval(tick, 1000);
      setState((prev) => (prev ? { ...prev, isRunning: true, isPaused: false } : prev));
    }
  };

  const resetTimer = () => {
    if (!pattern) return;
    stopTimerInterval();
    setIsComplete(false);
    setState({
      isRunning: false,
      isPaused: false,
      currentBlockIndex: 0,
      currentSegmentIndex: 0,
      currentBlockRepeat: 1,
      currentPatternRepeat: 1,
      remainingSeconds: pattern.blocks[0]?.segments[0]?.durationSeconds || 60,
      totalElapsedSeconds: 0,
    });
  };

  const handleSkip = () => {
    if (isComplete || !state) return;
    setState((prev) => {
      if (!prev) return prev;
      const skipTo = Math.min(settings.skipAheadSeconds, prev.remainingSeconds);
      return { ...prev, remainingSeconds: skipTo };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-cream/45">Loading...</p>
      </div>
    );
  }

  if (!pattern || !state) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-black text-cream">Timer not found</p>
        <Link to="/" className="text-signal hover:text-cream">
          Go back home
        </Link>
      </div>
    );
  }

  const currentBlock = pattern.blocks[state.currentBlockIndex];
  const segmentColor = currentSegment?.color || '#F59E0B';
  const progress = currentSegment
    ? 1 - state.remainingSeconds / currentSegment.durationSeconds
    : 0;

  const blockRepeatText =
    currentBlock?.repeatCount === -1
      ? `Loop ${state.currentBlockRepeat}`
      : `${state.currentBlockRepeat}/${currentBlock?.repeatCount}`;

  const patternRepeatText =
    pattern.repeatEntirePattern === -1
      ? `Cycle ${state.currentPatternRepeat}`
      : `Cycle ${state.currentPatternRepeat}/${pattern.repeatEntirePattern}`;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: segmentColor }}
    >
      <div className="absolute inset-0 bg-background/55" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(247,240,224,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(247,240,224,0.22)_1px,transparent_1px)] [background-size:34px_34px]" />

      <Link
        to="/"
        className="absolute left-5 top-6 z-10 flex items-center gap-2 rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm font-bold text-white/80 backdrop-blur transition-colors hover:border-white/50 hover:text-white"
        aria-label="Back to timers"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </Link>

      <p className="absolute left-1/2 top-7 z-10 max-w-[42vw] -translate-x-1/2 truncate rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-center text-sm font-bold text-white/65 backdrop-blur">
        {pattern.name}
      </p>

      <div className="z-10 flex flex-col items-center px-5 text-center">
        <p className="mb-4 rounded-lg border border-white/15 bg-black/25 px-4 py-2 text-xl font-black uppercase text-white/90 backdrop-blur sm:text-2xl">
          {isComplete ? 'Complete!' : currentSegment?.name || 'Timer'}
        </p>

        <p className="timer-font font-mono text-[clamp(4.75rem,22vw,12rem)] font-black leading-none text-white tabular-nums drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          {formatTime(state.remainingSeconds)}
        </p>

        <div className="mt-8 h-2 w-[min(78vw,34rem)] overflow-hidden rounded-lg border border-white/20 bg-black/30">
          <div
            className="h-full rounded-lg bg-signal transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="z-10 mt-10 grid w-[min(90vw,36rem)] grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/15 bg-black/25 p-3 text-center backdrop-blur">
          <p className="mb-1 text-xs font-bold uppercase text-white/45">Block</p>
          <p className="font-black text-white/90">{blockRepeatText}</p>
        </div>
        <div className="rounded-lg border border-white/15 bg-black/25 p-3 text-center backdrop-blur">
          <p className="mb-1 text-xs font-bold uppercase text-white/45">Elapsed</p>
          <p className="font-black text-white/90">{formatTime(state.totalElapsedSeconds)}</p>
        </div>
        <div className="rounded-lg border border-white/15 bg-black/25 p-3 text-center backdrop-blur">
          <p className="mb-1 text-xs font-bold uppercase text-white/45">Pattern</p>
          <p className="font-black text-white/90">{patternRepeatText}</p>
        </div>
      </div>

      <div className="z-10 mt-6 flex gap-2">
        {currentBlock?.segments.map((seg, i) => (
          <div
            key={seg.id}
            className={cn(
              'h-3 w-10 rounded-lg border border-white/20 transition-all duration-300',
              i === state.currentSegmentIndex ? 'opacity-100' : 'opacity-40'
            )}
            style={{ backgroundColor: seg.color }}
          />
        ))}
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-5">
        <button
          onClick={resetTimer}
          className="rounded-lg border border-white/15 bg-black/25 p-4 text-white/65 backdrop-blur transition-colors hover:border-white/45 hover:text-white"
          aria-label="Reset timer"
          title="Reset"
        >
          <RotateCcw className="h-6 w-6" />
        </button>

        <button
          onClick={toggleTimer}
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-lg border border-signal bg-signal text-ink shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-colors hover:bg-cream',
            isComplete && 'border-cream bg-cream'
          )}
          aria-label={isComplete ? 'Reset timer' : state.isRunning ? 'Pause timer' : 'Start timer'}
          title={isComplete ? 'Reset' : state.isRunning ? 'Pause' : 'Start'}
        >
          {isComplete ? (
            <RotateCcw className="h-9 w-9" />
          ) : state.isRunning && !state.isPaused ? (
            <Pause className="h-9 w-9" fill="currentColor" />
          ) : (
            <Play className="ml-1 h-9 w-9" fill="currentColor" />
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={isComplete}
          className={cn(
            'rounded-lg border border-white/15 bg-black/25 p-4 text-white/65 backdrop-blur transition-colors hover:border-white/45 hover:text-white',
            isComplete && 'opacity-30 cursor-not-allowed'
          )}
          aria-label={`Skip to ${settings.skipAheadSeconds} seconds remaining`}
          title="Skip ahead"
        >
          <SkipForward className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
