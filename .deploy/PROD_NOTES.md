# Production Deployment Notes

## Deployment Type
This repo includes a Vite web app that builds to static assets, so static hosting is the simplest and most reliable production option. The build output lives in `apps/web/dist`.

## Environment Variables
No required environment variables were found in the repo.

## Pre-deployment Checklist
- [ ] Run `pnpm install --frozen-lockfile`
- [ ] Run `pnpm run build:web`
- [ ] Deploy the contents of `apps/web/dist` to your static host

## Recommendations
If you expect server-side features in the future, add a Dockerfile to the repo so production environments are fully reproducible. A simple Vite Dockerfile can run the build step and serve assets with a lightweight static server.
