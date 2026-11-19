# Nigertoday TV Subscription Manager: Backend

REST API for one business owner (admin) who tracks customer TV subscriptions: add customers, see who is expiring or expired, renew, record payments, and send reminders by email and WhatsApp.

Customers never log in. The only role is `admin`.

## Stack

Node 24 (CommonJS), Express 4, MongoDB + Mongoose 7, Joi, passport-jwt (Bearer access + single-use refresh tokens), node-cron 3, luxon, nodemailer, axios, Swagger.

## Quick start

```sh
npm install
cp .env.example .env     # fill MONGODB_URL, JWT_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
npm run seed             # owner + settings + 30 customers (set MOCK_TODAY=2026-10-05 first)
npm run dev              # http://localhost:5000/api/v1
```

Frontend: `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | nodemon |
| `npm start` | production start |
| `npm run seed` | full reset of business data + seed (refuses in production without `SEED_FORCE=yes`) |
| `npm test` | unit tests (`node --test`, no extra libraries) |
| `npm run snapshot` | writes `backend-contract-snapshot.md` |

## Environment variables

See `.env.example` (keys and safe defaults only, never commit `.env`). Required: `NODE_ENV`, `MONGODB_URL`, `JWT_SECRET`.

Safety defaults: `EMAIL_PROVIDER=mock`, `WHATSAPP_PROVIDER=mock`, `JOBS_ENABLED=false`, `REMINDERS_ENABLED=false`. `MOCK_TODAY` is development only: the app will not start with it in production.

## "Today"

Business "today" is the date in `APP_TIMEZONE` (default `Asia/Dhaka`). In development set `MOCK_TODAY=2026-10-05` to match the seed data. Status is never stored: it is computed from `expiresAt` (Active > 10 days left, Expiring 0-10, Expired < 0).

## API

Base path `/api/v1`. Success body: `{ code, message, data: { type, attributes } }`. Error body: `{ code, message }`. All routes need `Authorization: Bearer <access token>` except `POST /auth/login`, `POST /auth/refresh-tokens` and `GET /health`.

| Area | Endpoints |
|---|---|
| Health, meta | `GET /health`, `GET /meta` |
| Auth | `POST /auth/login`, `/auth/refresh-tokens`, `/auth/logout`, `/auth/change-password` |
| Account | `GET /users/self/in`, `PATCH /users/self/update` |
| Customers | `GET /customers`, `GET /customers/stats`, `POST /customers`, `GET/PATCH/DELETE /customers/:id`, `POST /customers/:id/renew`, `PUT /customers/:id/renewals/:renewalId/payment`, `GET /customers/:id/reminders` |
| Dashboard | `GET /dashboard/summary` |
| Payments | `GET /payments` |
| Settings | `GET /settings`, `PATCH /settings` |
| Reminders | `POST /reminders/run`, `POST /reminders/digest`, `GET /reminders/logs` |

Refresh tokens are single-use: every refresh returns a new pair.

### Swagger

Interactive docs are served at `/api/v1/docs` **only when `NODE_ENV=development`**. They are not exposed in production.

### Postman

1. Create an environment with `baseUrl = http://localhost:5000/api/v1`.
2. `POST {{baseUrl}}/auth/login` with `{ "email": "<SEED_ADMIN_EMAIL>", "password": "<SEED_ADMIN_PASSWORD>" }`.
3. Use the `access.token` from `data.attributes.tokens` as a Bearer token.

## Business rules

- Expiry = start + 3, 6 or 12 calendar months (clamped to the month end).
- Renew: `newExpiry = max(currentExpiry, today) + months` (decision D6, one function: `getRenewalBase` in `utils/subscription.js`). A parallel renew returns `409`.
- Phone is the identity: required, unique, normalized to E.164 (`01712345678` becomes `+8801712345678`). Email is optional and not unique.
- Payments are recorded manually (no gateway). One payment per renewal, `paid` or `unpaid`, currency BDT.
- Delete is permanent and cascades to renewals, payments and reminder logs.
- No Mongo transactions (standalone MongoDB): writes are ordered with compensation on failure.

## Reminder engine

- node-cron ticks hourly in `APP_TIMEZONE` and works only when the local hour is at or after `reminderSendHour`. It also runs once at startup.
- Types: `d7`, `d3`, `d1` and `expired` (the day after expiry), each with a settings toggle.
- A unique `ReminderLog` per `{ customerId, periodEnd, type, channel }` prevents duplicates. Failed sends retry up to 3 attempts per day. Missed days are not back-filled.
- Strategy `both` sends on every selected channel. `whatsapp_then_email` sends email only if WhatsApp fails.
- After 18:00 a daily failure digest is emailed to the admin (setting `failureDigestEnabled`).
- Providers default to `mock` (log only). Real providers are never used while `MOCK_TODAY` is set or for seed contacts (`+88017000000NN`, `@email.com`).
- Mock failure test hooks: a phone ending in `0000` fails on WhatsApp, an email starting with `fail@` fails on email.
- WhatsApp needs a Meta-approved template. Suggested body: `Hi {{1}}, your TV subscription expires on {{2}} ({{3}}). Please renew to keep your service running. Thank you!` and a second template for `expired` with 2 params.

Manual testing: `POST /reminders/run?dryRun=true` lists what would happen and sends nothing. A real run needs `REMINDERS_ENABLED=true` and `DEMO_MODE=false`.

## Deployment (VPS + PM2)

```sh
npm ci --omit=dev
pm2 start ecosystem.config.json
pm2 save
```

- Run **exactly one instance** (`instances: 1`, fork mode). node-cron runs inside the app, so two instances would send every reminder twice.
- The scheduler starts only when `JOBS_ENABLED=true` **and** `REMINDERS_ENABLED=true` (and `DEMO_MODE=false`). Leave both `false` until the real providers are configured.
- Set `NODE_ENV=production`, `TRUST_PROXY=1` behind Nginx, and `FRONTEND_URL` to the Vercel domain.
- PM2 logs go to `./logs/out.log` and `./logs/error.log`. The app also writes `app.log` in the working directory. Add `logs/` and `app.log` to `.gitignore`.
- Never set `MOCK_TODAY` in production.

## Demo deployment

A separate deployment with its own database, reseeded nightly, `DEMO_MODE=true`, `JOBS_ENABLED=false`. No public credentials on the production login page.

## Tests

`npm test` runs `node --test` over `tests/unit/*.test.js`: dates, status and buckets, phone normalization, renewal base, template helpers and seed-data consistency. They cover the spec section 8 vectors that are pure functions. The concurrency vectors (create with an existing phone, renew twice at the same time) are API-level: check them with Postman.

## License

ISC