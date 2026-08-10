# SNMC Council Voting & Registration Platform

Scaffolded from the build spec (see the "SNMC Platform Build Prompt"
document). TypeScript, Next.js (App Router), Supabase, deployed on Vercel.

## What's here

- Three portals, route-isolated by `middleware.ts` + `lib/auth/guards.ts`:
  - `/portal` — Nurse/Midwife self-service + voting
  - `/council` — Councillor Portal (read-only, default scope — see Section
    4a of the build spec, unconfirmed with the Council)
  - `/admin` — Staff Portal (role-scoped)
- `/verify/[token]` — public QR licence verification page
- `supabase/migrations/0001_init.sql` — full schema + RLS policies
- `supabase/seed/import-register.md` — how to migrate the cleaned register

## Auth

Login is **Registration Number + NIN only** — no OTP/second factor, kept
simple for now. This is a stated trade-off, not an oversight: see the
comment at the top of `lib/auth/identify.ts`. If the Council wants stronger
assurance before Round 1 goes live, a second factor can be re-added at that
exact function boundary without touching the rest of the app.

## What's stubbed / needs a real decision before go-live

Everything below is called out in-line with a `TODO` or a comment pointing
back to the relevant section of the build spec:

- **First-login account provisioning** (`lib/auth/identify.ts`) — the
  magic-link approach used to issue a session is a placeholder, not a
  final design. Supabase Auth is built around email/phone identities;
  this app's real identity is registration-number + NIN. Worth a proper
  design pass (e.g. a custom JWT minted server-side) rather than bending
  Supabase's built-in flows further.
- **Round 2 trigger logic, tie-breaks, proxy voting** — not implemented;
  Round 1 only. See build spec Section 10.
- **19 registration-number conflicts** — must be resolved (or worked
  around per `supabase/seed/import-register.md`) before the `unique`
  constraint in the migration will accept a full data import.
- **Admin pages for register management, elections config, and reports**
  (`/admin/register`, `/admin/elections`, `/admin/reports`) — linked from
  the nav but not yet built; only the dashboard exists.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## Deploying

1. Create a Supabase project, run `supabase/migrations/0001_init.sql`
   against it (via the SQL editor or the Supabase CLI).
2. Push this repo to GitHub.
3. Import the repo into Vercel, set the environment variables from
   `.env.example` in the Vercel project settings.
4. Deploy — Vercel will build on every push, with preview deployments per
   PR.

## Brand

Colors and type in `tailwind.config.ts` are drawn from the actual SNMC
logo (navy lamp, gold flame) rather than a generic palette — adjust as
needed once the Council has design input.
