# MMT Connect — Frontend

Next.js 14 (App Router) web app for MMT Care Connect:

- **`/find`** — public NDIS vacancy search + referral submission (no login)
- **`/dashboard`** — coordinator/admin console (referrals, facilities, matching,
  placements, analytics, users, error logs)
- **`/login`, `/forgot-password`, `/reset-password`** — auth

Talks to the API (`mmtconnect-api`) over HTTP only — no database access.

## Local dev

```bash
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL to your API
npm run dev                     # http://localhost:3000
```

## Deploy (Vercel)

New project from this repo, Root Directory = repo root, framework **Next.js**
(auto). Env vars:

```
NEXT_PUBLIC_API_URL          = https://<mmtconnect-api-url>/api/v1
NEXT_PUBLIC_OPENCAGE_API_KEY  = <key>
```

Domain: `app.mmtcare.com.au`.

## Structure

```
src/
  app/
    find/            public search + referral + tracking
    dashboard/       authenticated console
    (auth)/          login / password reset
  components/        layout, ui primitives, charts, LocationPicker
  hooks/useData.ts   SWR data hooks
  lib/api.ts         typed API client with auto token refresh
```
