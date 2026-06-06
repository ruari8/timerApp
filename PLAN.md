# Project Roadmap

This file tracks the current shape of the prototype and the most useful next improvements.

## Current State

- Web app is deployed at https://timerapp.ruari.dev/
- Web build passes with `pnpm build`
- Web, mobile, and shared TypeScript checks pass with `pnpm check`
- Mobile app runs through Expo and shares the same timer model as web
- Timer patterns and settings persist locally on each platform

## Recently Cleaned Up

- README updated for the actual pnpm/Turbo monorepo
- `pnpm lint` no longer points at a missing ESLint install
- Added explicit `pnpm check` TypeScript verification across all workspaces
- Fixed a mobile pause/resume state bug
- Fixed stale mobile import from removed local types
- Hardened stored pattern loading against invalid JSON
- Made web timer-card actions usable on touch devices

## Next Useful Improvements

1. Add focused unit tests for repeat-position logic in `packages/shared`.
2. Add import/export for timer patterns so local-only data is portable.
3. Improve editor validation for empty names, invalid colors, and imported bad data.
4. Add real audio assets or a more deliberate sound system for mobile.
5. Add local notifications/background behavior for long mobile timers.
6. Add a small screenshot or GIF to the README once the UI settles.

## Verification Commands

```bash
pnpm install
pnpm check
pnpm build
pnpm dev:web
pnpm dev:mobile
```
