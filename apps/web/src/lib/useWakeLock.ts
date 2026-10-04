import { useEffect } from 'react';

// Keeps the screen awake while `active` is true, where the browser supports it
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) sentinel.release();
        else lock = sentinel;
      } catch {
        // Denied (e.g. low battery); nothing to do
      }
    };

    // The lock is dropped whenever the page is hidden, so re-acquire on return
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release();
    };
  }, [active]);
}
