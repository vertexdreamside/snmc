# Fix: createClient() not awaited — 49 files

`lib/supabase/server.ts`'s `createClient()` function is declared `async`
(it has to be, since it reads cookies asynchronously). That means every
caller needs to write `await createClient()`, not just `createClient()`.

49 files across the app were calling it without `await`. This didn't
show up until now because Next.js only caught it once the earlier
`params`/`searchParams` errors were out of the way — TypeScript reports
one class of error at a time in some cases, it doesn't always show you
everything wrong at once.

I checked the entire codebase after this fix and confirmed no
`createClient()` call (server-side) remains un-awaited anywhere. (Two
files — `app/admin/login/page.tsx` and
`lib/components/SessionExpiryWarning.tsx` — call a *different*,
non-async `createClient()`, the browser-side version, so those are
correctly left alone.)

## How to upload

Same as the last batch: clone your repo locally, extract this ZIP on
top of it (overwrite when prompted), commit, and push everything at
once. Every file here is already at its correct path relative to your
repo root.

## What changed

Only this, wherever it appeared in each file:
```diff
- const supabase = createClient();
+ const supabase = await createClient();
```
No other logic was touched.
