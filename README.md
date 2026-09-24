# SNMC Council Voting & Registration Platform (Next.js + TypeScript)

The Seychelles Nurses & Midwives Council's platform for triennial Councillor
elections (nomination + two-round voting) and the nurse/midwife register
(registration, verification, self-service profile updates, licence renewal).

## Stack

- Next.js 15 (App Router) + React + TypeScript
- Supabase (Postgres + Auth)
- Tailwind CSS (design tokens in `tailwind.config.ts`)
- Zod (form/API validation)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment variables

Set these in `.env.local` for local development, and in the Vercel project's
Environment Variables for deployment:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role secret key (bypasses
  Row Level Security; used only in admin-only server-side API routes — never
  expose this to the browser, and treat it as a real credential)
- `QR_SIGNING_SECRET` — secret used to sign/verify QR codes (e.g. for
  registration verification)

## Project structure

```
app/
  page.tsx                        Public landing page (portal picker)
  portal/                         Nurse/midwife self-service portal
    login/                        Portal login
    (authenticated)/              Profile, nominate, vote, licence renewal
  admin/                          Council office admin panel
    login/                        Admin login
    (authenticated)/              Dashboard, elections, register, people,
                                   users, audit log, reports
  council/                        Public councillor listing
  verify/[token]/                 Public registration verification page
  api/                             Route Handlers (admin, portal, public)
lib/
  supabase/                       Browser client (client.ts) and server /
                                  service-role clients (server.ts)
  auth/                           Auth guards and eligibility rules
  components/                    Shared UI used across app/ (EmptyState,
                                  ContactFooter, etc.)
public/
  snmc-emblem.png, snmc-logo-full.png   Official SNMC logo assets
```

## Design notes

- Brand colors (`council-navy`, `council-cyan`, `council-cream`, etc.) are
  Tailwind tokens defined in `tailwind.config.ts`, taken from the official
  SNMC emblem. Semantic status colors (`status-active`, `status-pending`,
  `status-closed`) are used for registration/profile status pills across the
  admin panel.
- Fonts: Fraunces (display), Work Sans (body), Yesteryear (script accent) —
  loaded via `next/font/google` in `app/layout.tsx`. This requires network
  access to fonts.googleapis.com at build time (works out of the box on
  Vercel).

## Deployment

Push to GitHub and import the repo in Vercel. Set the Supabase environment
variables above in the Vercel project before deploying.
