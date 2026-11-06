# Nigertoday TV – Subscription Manager

Private owner dashboard to track customer TV subscriptions, expiries and renewals. Frontend only, with mock data. Works on phone and computer.

**Live demo:** https://tv-subscription-manager.vercel.app/

**Demo login**
- Email: `cwjihad@gmail.com`
- Password: `cwjihad123`

## Features
- Dashboard with status counts, expiring soon list and recently expired list
- Customers list with search and status filters
- Expiring (1–3, 4–7, 8–10 days) and Expired pages
- Add, edit and delete customers
- Renew subscription (new expiry = current expiry + 3, 6 or 12 months)
- Send reminder: pick a template, edit the text, copy the message (nothing is sent)
- Settings and change password (mock)

## Stack
Next.js (App Router) · TypeScript (strict) · Tailwind CSS 4 · DaisyUI 5 · lucide-react

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Mock behaviour
- "Today" is fixed in `src/lib/today.ts` (`MOCK_TODAY = 2026-10-05`) so the screens match the design. Switch to the real date there.
- All data goes through `src/lib/api`. Replace this layer when the backend exists.
- Data is kept in memory, so a refresh resets any added, renewed or deleted customers.
- Login uses the demo credentials in `src/lib/demo.ts`. The session is a localStorage flag (`src/lib/session.ts`).
- Dev flags (stored in sessionStorage; turn off with `=0`):
  - `?empty=1` returns an empty customer list
  - `?fail=1` makes saving fail

## Structure
```
src/app/login            Login
src/app/(app)/...        Authenticated pages (dashboard, customers, expiring, expired, settings)
src/components/{ui,layout,customers,auth,settings}
src/lib                  Pure logic: dates, status, formatting, validation, reminders, api, mock-data
src/hooks                useNavCounts, useDashboardSummary, useCustomerModals, useToast, useLogout
```

## Rules
- Status is computed from dates, never stored.
- Active: more than 10 days left. Expiring soon: 0–10 days left. Expired: past the expiry date.
- Payment is outside the app. Renew only updates the customer record.