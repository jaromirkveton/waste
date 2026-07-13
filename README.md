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

Web push works on iPhone **only when the app is installed on the Home Screen** (Safari → Sdílet → Přidat na plochu). Vercel Hobby cron can only run **once per day**, so you also need an external scheduler (below) to check bins every 30 minutes while the app is idle.

### External scheduler (required for timely alerts)

Use a free cron service to `POST` the check endpoint every 30 minutes:

**[cron-job.org](https://cron-job.org)** (free):

1. Create account → **Create cronjob**
2. URL: `https://waste-one-red.vercel.app/api/check-bins`
3. Method: **POST**
4. Schedule: every **30 minutes**
5. Save and enable the job

Alternative: [Upstash QStash](https://upstash.com/docs/qstash/features/schedules) schedules (if you use Upstash).

### Vercel setup

1. **Environment variables** (Settings → Environment Variables):
   - `VITE_GOLEMIO_TOKEN` — Golemio API token
   - `VITE_VAPID_PUBLIC_KEY` — public VAPID key (same as `VAPID_PUBLIC_KEY`)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — generate with `npm run generate-vapid`
   - `CRON_SECRET` — random string (Vercel sets this automatically for cron jobs)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — from [Upstash Redis](https://vercel.com/marketplace?category=storage&search=redis) integration

2. **Redeploy** after adding variables.

3. On iPhone: open the deployed site → **Přidat na plochu** → open from Home Screen → **Zapnout notifikace**.

## Architecture

- **Container data**: Golemio REST API (`/v2/sortedwastestations`)
- **Fixed address**: hardcoded in `shared/address.ts`
- **Push**: External cron (every 30 min) + daily Vercel Cron backup + Web Push (service worker)
- **UI**: React + TypeScript + Vite + Tailwind + TanStack Query
