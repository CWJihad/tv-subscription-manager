# Demo deployment (B10)

A separate deployment with its own database. It is reseeded every night and never sends a message.

## What the demo mode does
- Seed dates follow today (`utils/demoDates.js`), so there are always 4 expiring, 2 expired and 24 active customers.
- Nightly reseed at `DEMO_RESEED_HOUR` (default 3, `APP_TIMEZONE`), done inside the app (`jobs/demo.job.js`). The first start on an empty database seeds once.
- Reminders and the failure digest are off (`DEMO_MODE=true`). Mock providers are enforced at start-up.
- Change password and "update my account" return 403. Creating a customer returns 403 after `DEMO_MAX_CUSTOMERS`.
- Stricter rate limits (login 10 failed per 15 min, API 200 per 15 min per IP).
- `GET /meta` returns `demoMode: true` so the frontend can show a "Demo" banner.
- The reseed refuses to run unless the database name contains `demo`.

## Deploy checklist
1. VPS with Node 24, MongoDB and PM2. Create the demo database name with `demo` in it (for example `nigertoday-tv-demo`).
2. Copy `.env.demo.example` to `.env` and fill the keys: new `JWT_SECRET`, `FRONTEND_URL`, `SEED_ADMIN_EMAIL`, new `SEED_ADMIN_PASSWORD` (not the production one).
3. `npm ci --omit=dev`, then `pm2 start ecosystem.config.json` (one instance only, because the cron jobs run inside the app).
4. nginx with HTTPS in front of port 5000, `TRUST_PROXY=1`.
5. Check the log for "Demo data reseeded (empty database)" or run `npm run seed:demo` once.
6. Frontend: a separate Vercel project with `NEXT_PUBLIC_API_URL` pointing to the demo API.
7. Share the demo login privately. Never print it on the login page.
8. Check `/api/v1/health`, log in, and confirm change password returns "This action is disabled in the demo."

## Local test of demo mode
Use a database name with `demo` in it, `DEMO_MODE=true`, `JOBS_ENABLED=false`, `MOCK_TODAY` empty, then `npm run seed:demo` and `npm run dev`.
