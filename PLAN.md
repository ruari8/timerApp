# Timer App Monorepo Migration Plan

> **Last Updated:** 2026-01-18
> **Purpose:** Track progress and enable session continuity after crashes

## Current Status: MOSTLY COMPLETE

Core migration tasks are done, with remaining work centered on verifying dev servers and cleaning up tooling errors.

---

## What Has Been Done

### 1. Monorepo Structure Created
- [x] Root `package.json` with workspaces and turbo scripts
- [x] `pnpm-workspace.yaml` configured
- [x] `turbo.json` configured for build/dev/lint tasks
- [x] `/apps/mobile` directory created with Expo app
- [x] `/apps/web` directory created with Vite + React app
- [x] `/packages/shared` directory created

### 2. Shared Package (`@repo/shared`)
- [x] Types exported (`TimerPattern`, `TimerBlock`, `TimerSegment`, `TimerState`, `AppSettings`)
- [x] Constants exported (`SOUND_OPTIONS`, `SEGMENT_COLORS`, `DEFAULT_SETTINGS`)
- [x] Helper functions exported (`formatTime`, `formatDuration`, `calculatePatternDuration`, etc.)
- [x] `StorageService` class with adapter pattern for cross-platform storage
- [x] Theme configuration exported
- [x] Package.json configured with proper exports

### 3. Web App (`@repo/web`)
- [x] Vite + React setup with TypeScript
- [x] TanStack Router configured
- [x] Tailwind CSS configured
- [x] Home page (`/`) with pattern list
- [x] Timer page (`/timer/$id`) with full timer functionality
- [x] Editor page (`/editor/$id`) with block + segment editing
- [x] Settings page (`/settings`) with skip/sound/haptic controls
- [x] Storage service using localStorage
- [x] Audio service using Web Audio API with haptic support
- [x] Path alias `@/` configured

### 4. Mobile App (`@repo/mobile`)
- [x] Expo app moved to `/apps/mobile`
- [x] Package.json has `@repo/shared` dependency
- [x] React Navigation configured
- [x] All screens present (Home, Editor, Timer, Settings)

---

## What Still Needs To Be Done

### CRITICAL: Dependencies Not Installed
```bash
# Run this first!
pnpm install
```

### Issue 1: Mobile App Still Using Local Types (RESOLVED)
All mobile imports now use `@repo/shared`; local types file removed.

### Issue 2: Mobile Storage Not Using StorageService (RESOLVED)
`apps/mobile/src/utils/storage.ts` now wraps `StorageService` with an AsyncStorage adapter.

### Issue 3: Web App Missing Routes (RESOLVED)
Editor and settings routes now exist.

### Issue 4: Route Tree Not Generated (RESOLVED)
`routeTree.gen.ts` generated after running `pnpm dev:web`.

### Issue 5: Mobile Theme Not Using Shared Theme (RESOLVED)
Mobile screens now import `theme` from `@repo/shared`; local theme file removed.

### Issue 6: Duplicate Helper Functions (RESOLVED)
Mobile screens/components now import helpers from `@repo/shared`; local helper file removed.

---

## Cleanup Tasks

### Files That Can Be Deleted After Migration
- [x] `apps/mobile/src/types/index.ts` - removed after switching imports
- [x] `apps/mobile/src/utils/helpers.ts` - removed after switching imports

### Files That Need Content Updates
- [x] `apps/mobile/src/utils/theme.ts` - removed after switching imports
- [x] `apps/mobile/src/utils/storage.ts` - now uses shared StorageService

---

## Next Steps (In Order)

1. **Install dependencies**: `pnpm install`
2. **Verify web editor + settings UI**: `pnpm dev:web`
3. **Verify mobile dev server**: `pnpm dev:mobile` (note simctl error)
4. **Optional**: address iOS simulator setup if needed

---

## Quick Commands

```bash
# Install all dependencies
pnpm install

# Run web app
pnpm dev:web

# Run mobile app
pnpm dev:mobile

# Build all
pnpm build

# Clean everything
pnpm clean
```

---

## Architecture Overview

```
timerApp/
├── apps/
│   ├── mobile/          # Expo React Native app
│   │   ├── src/
│   │   │   ├── screens/     # Home, Editor, Timer, Settings
│   │   │   ├── components/  # PatternCard, BlockEditor, SegmentEditor
│   │   │   └── utils/       # storage, audio, theme, helpers
│   │   ├── App.tsx
│   │   └── package.json
│   │
│   └── web/             # Vite + React app
│       ├── src/
│       │   ├── routes/      # TanStack Router file-based routes
│       │   └── lib/         # storage, audio, utils
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/          # Shared code between platforms
│       └── src/
│           ├── types.ts     # All TypeScript interfaces
│           ├── helpers.ts   # Utility functions
│           ├── storage.ts   # StorageService class
│           ├── theme.ts     # Theme configuration
│           └── index.ts     # Public exports
│
├── package.json         # Root workspace config
├── pnpm-workspace.yaml  # PNPM workspaces
├── turbo.json          # Turborepo config
└── PLAN.md             # This file
```

---

## Session Recovery Instructions

If your session crashes, do the following:

1. Open this file (`PLAN.md`)
2. Check the "What Still Needs To Be Done" section
3. Continue from the next incomplete task
4. Update this file as you complete tasks

---

## Error Log

Document any errors encountered for debugging:

### Known Issues
- `pnpm dev:mobile` started Metro but reported `xcrun simctl help exited with non-zero code: 72` (iOS simulator tooling).

---
