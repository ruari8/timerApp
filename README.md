# Pattern Timer

A programmable interval timer for routines that do not fit a single countdown.

The app lets you build timer patterns from named segments, group them into repeatable blocks, and optionally loop the entire pattern. I originally built it as a small prototype for deploying a real app through my VPS, but the use cases are practical: gym intervals, Catan house-rule turn timers, Pomodoro-style focus loops, and other repeating sequences.

Live web app: [timerapp.ruari.dev](https://timerapp.ruari.dev/)

## What It Does

- Create custom timer patterns made of blocks and segments
- Repeat a block a fixed number of times or forever
- Repeat the whole pattern a fixed number of times or forever
- Set segment names, durations, colors, and end sounds
- Run timers with pause, reset, skip-ahead, elapsed time, and repeat counters
- Store timers and settings locally on web and mobile
- Share core timer types, helpers, presets, and storage logic across apps

## Current Status

This is a working prototype, not a polished product.

The web app builds and is deployed. The Expo mobile app shares the same core model and passes TypeScript checks, but it has not been productionized for App Store distribution. Persistence is local-only, there are no accounts, and background timer behavior is not fully solved for mobile yet.

## Tech Stack

- pnpm workspaces + Turborepo
- TypeScript
- React + Vite
- TanStack Router
- Tailwind CSS
- Expo + React Native
- Shared package for timer models, helper functions, presets, settings, and storage

## Repository Structure

```text
timerApp/
  apps/
    web/       Vite React web app
    mobile/    Expo React Native app
  packages/
    shared/    Cross-platform timer types, helpers, theme, and storage service
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the web app:

```bash
pnpm dev:web
```

Run the Expo app:

```bash
pnpm dev:mobile
```

Build the web app and shared package:

```bash
pnpm build
```

Run TypeScript checks across the monorepo:

```bash
pnpm check
```

`pnpm lint` currently aliases the TypeScript check. There is not a full ESLint setup in this repo yet.

## Timer Model

A timer pattern is made of blocks. Each block contains one or more segments and has its own repeat count. The whole pattern can also repeat.

Example:

```text
Couch to 5K
  Block 1: repeat 8 times
    Segment: Run, 60 seconds
    Segment: Walk, 120 seconds
```

Infinite loops are represented with `-1`, which supports patterns like a Catan turn timer that keeps cycling until manually stopped.

## Presets

The app seeds local storage with a few starter patterns:

- Catan Turns
- Couch to 5K
- Pomodoro

## Notes

The most important implementation detail is the shared package. Both the web and mobile apps use the same timer types, duration helpers, repeat-position logic, default patterns, settings, and storage abstraction. Platform-specific code provides only the storage adapter and audio/haptic implementation.

Useful next improvements would be stronger validation, proper bundled audio assets on mobile, import/export for timer patterns, and real background notifications for long-running mobile timers.
