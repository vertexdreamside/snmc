-- Section 4/6: "View the user's account creation date" — admin_users had
-- no created_at column at all. Also fixes a genuine spec violation:
-- "Remove Account" was doing a literal DELETE on the row, contradicting
-- the explicit requirement to use soft-deletion so historical records
-- (and every audit_log entry attributing an action to this admin) stay
-- intact and attributable. is_removed is deliberately separate from the
-- existing is_disabled — Disable is a reversible day-to-day suspension;
-- Remove is the more permanent "no longer with the Council" case, kept
-- out of the normal active list but never actually deleted.

alter table admin_users add column if not exists created_at timestamptz not null default now();
alter table admin_users add column if not exists is_removed boolean not null default false;
