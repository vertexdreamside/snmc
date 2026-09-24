# Sibert Residence — Website (Next.js + TypeScript)

A guest house website for Sibert Residence, La Passe, La Digue, Seychelles.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS (design tokens in `tailwind.config.ts`)
- Framer Motion (lazy-load intro, scroll reveals, drawer nav animation)
- Lucide React (icons)
- React Hook Form + Zod (booking & contact forms)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project structure

```
app/                 App Router pages (/, /rooms, /restaurant, /shop, /services, /contact)
components/          Header (burger drawer nav), Footer, Loader, BookingForm,
                      ContactForm, Boulder (signature image frame), PageHero, etc.
lib/content.ts        All site copy/data in one typed file — edit here to update
                      rooms, services, gallery, menu, and contact details.
```

## Design notes

- Palette and type scale are Tailwind tokens (`green-deep`, `gold`, `sand`, etc.) —
  see `tailwind.config.ts`.
- The signature visual motif is the "boulder" image frame (`components/Boulder.tsx`),
  an organic border-radius shape echoing La Digue's granite boulders.
- Fonts: Fraunces (display), Work Sans (body), Yesteryear (script accent) — loaded
  via `next/font/google` in `app/layout.tsx`. This requires network access to
  fonts.googleapis.com at build time (works out of the box on Vercel).

## Images

Photos currently reference the existing `sibert.sc` media library directly (real
property photos) so the site launches with real content. Before going live, either:

1. Keep the remote references (already allow-listed in `next.config.mjs` under
   `images.remotePatterns`), or
2. Download the photos into `/public/images` and update the paths in `lib/content.ts`
   for full control over the asset library.

## Email (booking & contact forms)

The booking form and contact form send real emails via [Resend](https://resend.com):

1. Create a free Resend account and copy an API key from Settings → API Keys.
2. Add `RESEND_API_KEY` to `.env.local` (and to your Vercel project's environment
   variables). See `.env.example`.
3. That's it — emails work immediately using Resend's shared `onboarding@resend.dev`
   sending address, which can deliver to any recipient with no extra setup.
4. For production, verify your own domain in Resend (Domains → Add Domain, add the
   DNS records they give you) and set `RESEND_FROM_EMAIL` so emails come from your
   own address (e.g. `bookings@sibert.sc`) instead of the shared sandbox domain.

Both forms send to whatever email is set as the property's email in **Site Info**
(admin panel) — currently `sibertresidence@seychelles.net` — with the guest's own
email set as Reply-To, so replying goes straight to them.

If `RESEND_API_KEY` isn't set, both forms show a clear error instead of silently
failing or pretending to succeed.

## Booking & payment (CyberSource)

The booking form (`components/BookingForm.tsx`) sends a real enquiry email with the
guest's details, dates, room, computed rate and applicable offers — but doesn't
process payment. That's a deliberate two-step flow: the property confirms
availability by email, then payment happens separately. To add real online payment
on top of this:

1. Stand up a small backend/serverless route (e.g. a Next.js Route Handler under
   `app/api/`) that generates a signed CyberSource Secure Acceptance payment token
   using your merchant credentials (never expose the secret key client-side).
2. After a successful booking enquiry email, redirect to CyberSource's hosted
   payment page (or render their embedded checkout) using the returned token.
3. Handle the CyberSource redirect/webhook back to a confirmation page to finalize
   the reservation in your booking database.

## Deployment

Designed for Vercel (matches the rest of the Databytes stack): push to GitHub and
import the repo in Vercel. Set the Supabase and Resend environment variables shown
in `.env.example` (and the future CyberSource ones, once you add that integration).
