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

A [cron-job.org](https://cron-job.org) job checks bin levels **every hour**. If a container was emptied since the last check, it sends a push notification automatically.

### Vercel setup

1. **Environment variables** (Settings → Environment Variables):
   - `VITE_GOLEMIO_TOKEN` — Golemio API token
   - `VITE_VAPID_PUBLIC_KEY` — public VAPID key (same as `VAPID_PUBLIC_KEY`)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — generate with `npm run generate-vapid`
   - `CRON_SECRET` — random string (used by cron-job.org to authenticate)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — from [Upstash Redis](https://vercel.com/marketplace?category=storage&search=redis) integration

2. **Redeploy** after adding variables.

3. On iPhone: open the deployed site → **Přidat na plochu** → open from Home Screen → **Zapnout notifikace**.

### cron-job.org setup

1. Create a cron job at [cron-job.org](https://cron-job.org) with:
   - **URL**: `https://waste-one-red.vercel.app/api/cron/check-bins`
   - **Schedule**: every hour (`0 * * * *`)
   - **Header**: `Authorization: Bearer <CRON_SECRET>`
2. Verify the first run returns **200 OK** in the job history.

## Architecture

- **Container data**: Golemio REST API (`/v2/sortedwastestations`)
- **Fixed address**: hardcoded in `shared/address.ts`
- **Push**: hourly cron-job.org + Web Push (service worker)
- **UI**: React + TypeScript + Vite + Tailwind + TanStack Query
