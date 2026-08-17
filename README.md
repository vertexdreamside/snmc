# SNMC Council Voting & Registration Platform

Scaffolded from the build spec (see the "SNMC Platform Build Prompt"
document). TypeScript, Next.js (App Router), Supabase, deployed on Vercel.

## What's here

- Three portals, route-isolated by `middleware.ts` + `lib/auth/guards.ts`:
  - `/portal` — Nurse/Midwife self-service, KYC/profile updates, nominations, voting
  - `/council` — Councillor Portal (read-only, default scope — see Section
    4a of the build spec, unconfirmed with the Council)
  - `/admin` — Staff Portal: register browser + approval, election
    management, customizable reports
- `/verify/[token]` — public QR licence verification page
- `supabase/migrations/` — schema, RLS, and one security fix (0003) applied
  in order
- `supabase/seed/import-register.md` — how to migrate the cleaned register

## Admin (Staff Portal)

- **`/admin/register`** — search/filter the full register (name, reg. no.,
  registration status, profile status), 100 results at a time. Click into
  a person for their full profile.
- **`/admin/register/[id]`** — approve or reject a pending self-service
  profile change, or mark someone deceased (admin-only, per Section 4).
  Field-level editing has a working API (`PATCH /api/admin/people/[id]`,
  `action: "edit_fields"`) but no edit UI wired up yet — approve/reject/
  mark-deceased are the only actions currently exposed as buttons.
- **`/admin/elections`** — create an election, see its status at a glance.
- **`/admin/elections/[id]`** — the actual election control panel:
  shortlist nominees (`Nominated` → `Shortlisted`, which is what makes
  them appear on the ballot), advance the round status
  (`Planned` → `Round 1 Open` → … → `Completed`), mark a candidate
  Elected/Not Elected, and publish results. Per-candidate vote counts are
  deliberately withheld while a round is open — only total participation
  is shown live — and only become visible once that round is *Closed*,
  matching Section 6's "participation, not vote content" rule during
  voting.
- **`/admin/reports`** — pick which fields to include from an allowlist,
  optionally filter by status/category, generate a table, export to CSV.
  The field allowlist lives in `lib/reports.ts` and is enforced
  server-side in `/api/admin/reports/register` — the endpoint takes
  user-supplied field names into a live Supabase query, so this isn't just
  a UI nicety.

## Nurse vs Midwife category confirmation

**Important operational reality, not just a schema detail:** the register
doesn't yet reliably say which registration numbers belong to Nurses vs
Midwives — `professional_category` as migrated is a best-effort guess, not
a confirmed fact. Migration `0004` adds `people.category_confirmed`
(defaults `false` for everyone, including on import — see
`supabase/seed/import-register.md`). The vote API, nominate API, and
candidate search all now require `category_confirmed = true` before
treating someone as eligible in a category — nobody nominates or votes
wrong because a guess happened to be wrong.

**`/admin/register/classify`** is the actual tool for fixing this once you
know: search/select a batch of people you've confirmed are Nurses (or
Midwives, or both), and bulk-confirm them in one action
(`POST /api/admin/people/bulk-classify`) rather than editing 1,000+
records one at a time. The admin dashboard shows a banner with the live
unconfirmed count linking straight there.

## KYC / self-service profile

`/portal/profile` — a nurse or midwife can update their address, phone
numbers, employer, place of work, employment sector, and training
institute. Registration number, NIN, and any status field are not
editable here, enforced server-side (`/api/portal/profile`), not just
left out of the form — see migration 0003 for why that distinction
matters.

## Admin users (Council staff, Ministers, Supervisors, Managers)

**`/admin/users`** (Super Admin only) — invite new admin users by email,
assign a role, change an existing user's role, or remove admin access.
Invitations go through Supabase Auth's real invite-by-email flow (a magic
link the person uses to set up sign-in) — nobody's password is ever
typed, seen, or handled by this app.

Migration `0005` adds three roles beyond the original four:

| Role | Access |
|---|---|
| Super Admin | Everything, including managing other admin users |
| Manager | Registration approval/edit **and** election management |
| Supervisor | Registration approval/edit only |
| Registration Officer | Registration approval/edit, category confirmation |
| Election Officer | Election setup, shortlisting, rounds, publishing results |
| Minister | Dashboard + reports only (same as Read Only) |
| Read Only | Dashboard + reports only |

**This mapping is a reasonable default I picked, not something the
Council has confirmed** — flagged in `lib/auth/guards.ts` and
`lib/auth/permissions.ts` where it's actually enforced. Worth a real
conversation before go-live: the 2004 Regulations give the Minister an
actual appointment role (2 Nurses + 1 Midwife to Council), which isn't
the same thing as a platform permission and isn't modeled here at all —
that decision happens outside this system.

**Password resets**: each admin user row has a "Reset Password" button
(Super Admin only) that triggers Supabase's built-in password-reset
email — nobody at the Council, including a Super Admin, ever sees or sets
another person's password. It goes to whatever email that account was
invited with.

**The dashboard and sidebar are also role-scoped**, using the same
mapping (`lib/auth/permissions.ts`): a Registration Officer sees register
stats and the Confirm-Categories nav item but no Elections section; an
Election Officer sees the reverse; Minister/Read Only see everything,
read-only, with no action banners. This is a real filter, not just
hidden buttons — the sidebar only renders links a role's `requireAdmin()`
calls would actually let it use.

Operational note: invite emails go out through Supabase's built-in email
sending, which has a low rate limit meant for development/testing —
configure a custom SMTP provider in the Supabase dashboard (Project
Settings → Auth → SMTP Settings) before relying on this for real staff
onboarding, or invitations (and password resets) may silently fail to
send once you exceed it.

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
- **Inline field editing on `/admin/register/[id]`** — the API
  (`PATCH /api/admin/people/[id]`, `action: "edit_fields"`) works; there's
  no edit form wired to it yet, only approve/reject/mark-deceased buttons.
- **`/admin/audit-log`** — linked from the sidebar, not built yet
  (`audit_log` is being written to by every admin action already, so the
  data exists — just no page to view it).
- **Round 2 shortlisting** — the election control panel shortlists once
  (`Nominated` → `Shortlisted`); re-shortlisting a fresh candidate set
  specifically for a Round 2 re-vote isn't a distinct step yet, since
  Round 2's exact trigger/process is still an open item (Section 10).

## Nomination & voting forms

`/portal/nominate/[electionId]` and `/portal/vote/[electionId]` digitize
the two historical paper forms field-for-field (`Nomination_Paper_1st_
Round_2012` and the 2nd-round ballot form):

- **Nomination form**: a Registered Licensed Nurse/Midwife nominates a
  candidate by searching the existing register (`/api/people/search`) and
  confirming their "Current Placement" — enforces the original's exact
  eligibility rule (Nurse-only registrants nominate a Nurse; Midwife-only
  registrants nominate a Midwife; someone registered as both may nominate
  either). Only available while the election is `Planned`.
- **Ballot form**: "make a tick against one candidate of your choice," one
  section per eligible category, pulling only `Shortlisted` candidates for
  the currently open round. Submits through the existing `/api/vote`
  route — the anonymity design (Section 3.3) is unchanged.

## Branding

The real SNMC logo (from `SNMC_NEW_LOGO.docx`) is wired in: `app/icon.png`
(auto-detected by Next.js as the favicon), `public/snmc-emblem.png` (the
cropped lamp emblem, used in the portal/council headers and the admin
sidebar), and `public/snmc-logo-full.png` (the complete logo, used on the
landing page).

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## Deploying

1. Create a Supabase project, run the five files in `supabase/migrations/`
   **in numeric order** (`0001_init.sql`, `0002_candidate_placement.sql`,
   `0003_lock_self_update.sql`, `0004_category_confirmation.sql`,
   `0005_admin_roles.sql`) via the SQL editor or the Supabase CLI.
2. Push this repo to GitHub.
3. Import the repo into Vercel, set the environment variables from
   `.env.example` in the Vercel project settings.
4. Deploy — Vercel will build on every push, with preview deployments per
   PR.

## Brand

Colors and type in `tailwind.config.ts` are drawn from the actual SNMC
logo (navy lamp, gold flame) rather than a generic palette — adjust as
needed once the Council has design input.
