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

## Architecture

- **Container data**: Golemio REST API (`/v2/sortedwastestations`)
- **Fixed address**: hardcoded in `src/services/api.ts` as `FIXED_ADDRESS`
- **UI**: React + TypeScript + Vite + Tailwind + TanStack Query
