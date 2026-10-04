import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppSettings,
  TimerPattern,
  getCurrentSegment,
  getNextPosition,
} from '@repo/shared';
import { playComplete, playSound, playTick, unlockAudio } from './audio';

export type RunnerStatus = 'ready' | 'running' | 'paused' | 'done';

export interface Position {
  blockIndex: number;
  segmentIndex: number;
  blockRepeat: number;
  patternRepeat: number;
}

// Time is tracked against the wall clock (endsAt) rather than by counting ticks,
// so the timer stays correct when the tab is throttled or the phone is locked.
interface RunnerState {
  status: RunnerStatus;
  pos: Position;
  stepTotalMs: number;
  remainingMs: number; // authoritative while not running
  endsAt: number; // authoritative while running
  elapsedMs: number; // accumulated before resumedAt
  resumedAt: number;
}

const START: Position = { blockIndex: 0, segmentIndex: 0, blockRepeat: 1, patternRepeat: 1 };

function stepMs(pattern: TimerPattern, pos: Position): number {
  return (getCurrentSegment(pattern, pos.blockIndex, pos.segmentIndex)?.durationSeconds ?? 60) * 1000;
}

function initialState(pattern: TimerPattern): RunnerState {
  const ms = stepMs(pattern, START);
  return { status: 'ready', pos: START, stepTotalMs: ms, remainingMs: ms, endsAt: 0, elapsedMs: 0, resumedAt: 0 };
}

function nextPosition(pattern: TimerPattern, pos: Position) {
  return getNextPosition(pattern, pos.blockIndex, pos.segmentIndex, pos.blockRepeat, pos.patternRepeat);
}

export function useTimerRunner(pattern: TimerPattern, settings: AppSettings) {
  const [state, setState] = useState(() => initialState(pattern));
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  const lastBeepRef = useRef('');

  const commit = useCallback((next: RunnerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const endSoundFor = useCallback(
    (pos: Position) =>
      getCurrentSegment(pattern, pos.blockIndex, pos.segmentIndex)?.endSound ?? settings.defaultEndSound,
    [pattern, settings.defaultEndSound]
  );

  const tick = useCallback(() => {
    const t = Date.now();
    let s = stateRef.current;
    if (s.status !== 'running') return;

    if (t >= s.endsAt) {
      // Catch up across every step boundary we passed (possibly several after a sleep)
      let { pos, endsAt } = s;
      let finishedPos = pos;
      let done = false;
      while (t >= endsAt) {
        finishedPos = pos;
        const next = nextPosition(pattern, pos);
        if (next.isComplete) {
          done = true;
          break;
        }
        pos = next;
        endsAt += stepMs(pattern, pos);
      }

      if (done) {
        commit({ ...s, status: 'done', remainingMs: 0, elapsedMs: s.elapsedMs + (endsAt - s.resumedAt) });
        playComplete(settings.hapticFeedback);
        setNow(t);
        return;
      }

      playSound(endSoundFor(finishedPos), settings.hapticFeedback);
      s = { ...s, pos, endsAt, stepTotalMs: stepMs(pattern, pos) };
      commit(s);
    }

    if (settings.countdownBeeps && s.stepTotalMs > 5000) {
      const secondsLeft = Math.ceil((s.endsAt - t) / 1000);
      const key = `${s.endsAt}:${secondsLeft}`;
      if (secondsLeft >= 1 && secondsLeft <= 3 && lastBeepRef.current !== key) {
        lastBeepRef.current = key;
        playTick(settings.hapticFeedback);
      }
    }
    setNow(t);
  }, [pattern, settings.hapticFeedback, settings.countdownBeeps, endSoundFor, commit]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [state.status, tick]);

  const start = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'running') return;
    unlockAudio();
    const t = Date.now();
    const base = s.status === 'done' ? initialState(pattern) : s;
    commit({ ...base, status: 'running', resumedAt: t, endsAt: t + base.remainingMs });
    setNow(t);
  }, [pattern, commit]);

  const pause = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'running') return;
    const t = Date.now();
    commit({
      ...s,
      status: 'paused',
      remainingMs: Math.max(0, s.endsAt - t),
      elapsedMs: s.elapsedMs + (t - s.resumedAt),
    });
    setNow(t);
  }, [commit]);

  const toggle = useCallback(() => {
    if (stateRef.current.status === 'running') pause();
    else start();
  }, [pause, start]);

  const reset = useCallback(() => {
    commit(initialState(pattern));
    setNow(Date.now());
  }, [pattern, commit]);

  const next = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'done') return;
    const t = Date.now();
    const nextPos = nextPosition(pattern, s.pos);
    const elapsedMs = s.status === 'running' ? s.elapsedMs + (t - s.resumedAt) : s.elapsedMs;
    if (nextPos.isComplete) {
      commit({ ...s, status: 'done', remainingMs: 0, elapsedMs });
      return;
    }
    const ms = stepMs(pattern, nextPos);
    commit({
      ...s,
      pos: nextPos,
      stepTotalMs: ms,
      remainingMs: ms,
      endsAt: t + ms,
      elapsedMs,
      resumedAt: t,
    });
    setNow(t);
  }, [pattern, commit]);

  const addTime = useCallback(
    (seconds: number) => {
      const s = stateRef.current;
      if (s.status === 'done') return;
      const ms = seconds * 1000;
      commit({
        ...s,
        stepTotalMs: s.stepTotalMs + ms,
        remainingMs: s.remainingMs + ms,
        endsAt: s.endsAt + ms,
      });
    },
    [commit]
  );

  const remainingMs = state.status === 'running' ? Math.max(0, state.endsAt - now) : state.remainingMs;
  const elapsedMs = state.status === 'running' ? state.elapsedMs + (now - state.resumedAt) : state.elapsedMs;

  return {
    status: state.status,
    pos: state.pos,
    segment: getCurrentSegment(pattern, state.pos.blockIndex, state.pos.segmentIndex),
    remainingMs,
    stepTotalMs: state.stepTotalMs,
    elapsedMs,
    start,
    pause,
    toggle,
    reset,
    next,
    addTime,
  };
}
