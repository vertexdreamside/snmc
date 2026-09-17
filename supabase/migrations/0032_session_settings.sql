-- Section 8: "The timeout should be configurable by the system
-- administrator if appropriate." Important constraint, stated plainly:
-- the actual session/token duration is a Supabase PROJECT setting
-- (Auth > Sessions > JWT expiry, in the Supabase dashboard) — this
-- application has no ability to override that at runtime, and this
-- table does not attempt to. What's genuinely configurable here is how
-- much advance warning a person gets before whatever that expiry
-- actually is — the one thing under this app's own control.

create table session_settings (
  id uuid primary key default gen_random_uuid(),
  warning_seconds_before_expiry int not null default 120,
  updated_at timestamptz default now(),
  updated_by uuid references admin_users(id)
);

insert into session_settings (warning_seconds_before_expiry) values (120);

alter table session_settings enable row level security;
create policy "session_settings_read_all" on session_settings for select using (true);
create policy "session_settings_admin_write" on session_settings for all using (auth_admin_role() is not null);
