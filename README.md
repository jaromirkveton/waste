# Odpady Praha

Lightweight companion app for [odpady.mojepraha.eu](https://odpady.mojepraha.eu). Shows waste container info for a fixed address — **Jeseniova 2593/98, Praha**.

## Setup

```bash
npm install
cp .env.example .env
# Add VITE_GOLEMIO_TOKEN from https://odpady.mojepraha.eu/env-config.js
npm run dev
```

Open http://localhost:5173/

## Push notifications (iOS)

Web push works on iPhone **only when the app is installed on the Home Screen** (Safari → Sdílet → Přidat na plochu).

A Vercel cron job checks bin levels **once per day at 15:00 Prague time** (13:00 UTC, `0 13 * * *`). If a container was emptied since the last check, it should send a push without opening the app. Opening the app also runs a backup check.

### Vercel setup

1. **Environment variables** (Settings → Environment Variables):
   - `VITE_GOLEMIO_TOKEN` — Golemio API token
   - `VITE_VAPID_PUBLIC_KEY` — public VAPID key (same as `VAPID_PUBLIC_KEY`)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — generate with `npm run generate-vapid`
   - `CRON_SECRET` — random string (Vercel sends this automatically to cron jobs)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — from [Upstash Redis](https://vercel.com/marketplace?category=storage&search=redis) integration

2. **Redeploy** after adding variables.

3. On iPhone: open the deployed site → **Přidat na plochu** → open from Home Screen → **Zapnout notifikace**.

## Architecture

- **Container data**: Golemio REST API (`/v2/sortedwastestations`)
- **Fixed address**: hardcoded in `shared/address.ts`
- **Push**: daily Vercel Cron + backup check on app open + Web Push (service worker)
- **UI**: React + TypeScript + Vite + Tailwind + TanStack Query
