-- "Disable users" from the platform requirements — previously the only
-- way to revoke an admin's access was permanent deletion. This adds a
-- reversible suspend, for cases like someone on leave, without losing
-- their account, title, or audit history.

alter table admin_users add column if not exists is_disabled boolean not null default false;

comment on column admin_users.is_disabled is
  'Reversible suspension — enforced in lib/auth/guards.ts''s requireAdmin(), not at the Supabase Auth layer, so a disabled account can still technically sign in to Supabase but is rejected the moment it tries to reach any admin page or API.';
