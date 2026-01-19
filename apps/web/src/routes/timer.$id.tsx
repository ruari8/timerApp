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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
          if (intervalRef.current) clearInterval(intervalRef.current);
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
  }, [pattern, settings.defaultEndSound]);

  const toggleTimer = () => {
    if (!state || !pattern) return;

    if (isComplete) {
      resetTimer();
      return;
    }

    if (state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState((prev) => (prev ? { ...prev, isPaused: true, isRunning: false } : prev));
    } else {
      intervalRef.current = window.setInterval(tick, 1000);
      setState((prev) => (prev ? { ...prev, isRunning: true, isPaused: false } : prev));
    }
  };

  const resetTimer = () => {
    if (!pattern) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
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
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!pattern || !state) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-400 text-xl">Timer not found</p>
        <Link to="/" className="text-amber-500 hover:text-amber-400">
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
      className="min-h-screen flex flex-col items-center justify-center relative transition-colors duration-500"
      style={{ backgroundColor: segmentColor }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-8 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </Link>

      {/* Pattern name */}
      <p className="absolute top-8 left-1/2 -translate-x-1/2 text-white/60 font-medium z-10">
        {pattern.name}
      </p>

      {/* Timer display */}
      <div className="flex flex-col items-center z-10">
        <p className="text-2xl font-semibold text-white/90 uppercase tracking-widest mb-4">
          {isComplete ? 'Complete!' : currentSegment?.name || 'Timer'}
        </p>

        <p className="text-8xl font-extralight text-white tracking-tight tabular-nums">
          {formatTime(state.remainingSeconds)}
        </p>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-white/20 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-8 mt-12 z-10">
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Block</p>
          <p className="text-white/90 font-semibold">{blockRepeatText}</p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Elapsed</p>
          <p className="text-white/90 font-semibold">{formatTime(state.totalElapsedSeconds)}</p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Pattern</p>
          <p className="text-white/90 font-semibold">{patternRepeatText}</p>
        </div>
      </div>

      {/* Segment preview dots */}
      <div className="flex gap-2 mt-8 z-10">
        {currentBlock?.segments.map((seg, i) => (
          <div
            key={seg.id}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              i === state.currentSegmentIndex ? 'scale-125 opacity-100' : 'opacity-50'
            )}
            style={{ backgroundColor: seg.color }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8 z-10">
        <button
          onClick={resetTimer}
          className="p-4 text-white/60 hover:text-white transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          onClick={toggleTimer}
          className={cn(
            'w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors',
            isComplete && 'bg-white/70'
          )}
        >
          {isComplete ? (
            <RotateCcw className="w-8 h-8 text-neutral-900" />
          ) : state.isRunning && !state.isPaused ? (
            <Pause className="w-8 h-8 text-neutral-900" fill="currentColor" />
          ) : (
            <Play className="w-8 h-8 text-neutral-900 ml-1" fill="currentColor" />
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={isComplete}
          className={cn(
            'p-4 text-white/60 hover:text-white transition-colors',
            isComplete && 'opacity-30 cursor-not-allowed'
          )}
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
