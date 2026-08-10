# Importing the consolidated register

Source: the "SNMC Consolidated Nurses Database" workbook (Master Database
tab) produced during the data-cleanup pass — 1,174 records after the
duplicate merge, with 19 known registration-number conflicts still open.

## Steps

1. Export the "Master Database" tab to CSV.
2. Write a one-off Node/TypeScript script (not included here — build once
   the real Supabase project exists) that:
   - Reads the CSV.
   - Maps columns to the `people` table (see `lib/types/database.ts` for
     the target shape).
   - Inserts via the **service-role client** (`createServiceRoleClient()`
     in `lib/supabase/server.ts`), since RLS would otherwise block a bulk
     insert with no `auth_user_id` set yet.
   - Leaves `auth_user_id` null at this stage — it gets populated the
     first time each person successfully completes the OTP login flow
     (requires a small addition to `verify-otp/route.ts` to create-and-link
     an `auth.users` row on first login, not yet built — see the TODO in
     that file).
3. **Do not enforce `unique` on `nurse_reg_no`/`midwife_reg_no` during this
   import.** The migration includes the constraint for ongoing data
   integrity, but 19 existing registration numbers are shared by two
   different people (see the "Registration Conflicts" tab of the same
   workbook). Import those as-is with a `notes` flag, then resolve with the
   Council via the admin UI before the constraint can hold for everyone.
   Practically: either import conflicting rows with one of the two numbers
   temporarily suffixed (e.g. `1339/22-b`), or defer the constraint at
   import time and add it in a follow-up migration once conflicts are
   resolved — pick whichever your import tooling supports more easily.
4. The ~410 "Unknown status" records import fine (the column has a default
   of `'Unknown'`) — no special handling needed beyond what's already in
   the schema. They're excluded from voter eligibility automatically since
   the vote API only accepts `registration_status = 'Practising'`.
