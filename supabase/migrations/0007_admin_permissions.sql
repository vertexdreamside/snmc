-- Replaces the fixed admin-role list with real, per-user configurable
-- permissions, per explicit direction: the Council should be able to
-- define exactly what a given person can do (e.g. "can see reports"
-- only, or a custom combination), not just pick from a preset list.
--
-- `role` stops being a permission-bearing enum and becomes a free-text
-- title (e.g. "Election Officer", "Treasurer") — purely descriptive,
-- shown in the UI, no longer checked anywhere for access control. The
-- four boolean flags below are what actually gate access from here on.

alter table admin_users drop constraint if exists admin_users_role_check;

alter table admin_users
  add column can_view_reports boolean not null default false,
  add column can_manage_register boolean not null default false,
  add column can_manage_elections boolean not null default false,
  add column can_manage_admin_users boolean not null default false,
  add column full_access boolean not null default false;

-- Backfill existing rows so nobody's access silently changes the moment
-- this migration runs — map each existing fixed role to the equivalent
-- permission set it already had under the old model (see the mapping
-- previously documented in lib/auth/permissions.ts).
update admin_users set full_access = true where role = 'Super Admin';
update admin_users set can_manage_register = true, can_manage_elections = true where role = 'Manager';
update admin_users set can_manage_register = true where role = 'Supervisor';
update admin_users set can_manage_register = true where role = 'Registration Officer';
update admin_users set can_manage_elections = true where role = 'Election Officer';
update admin_users set can_view_reports = true where role in ('Minister', 'Read Only');

comment on column admin_users.role is
  'Free-text title/label only (e.g. "Election Officer", "Treasurer") — display purposes, not access control. See the boolean permission columns for what this person can actually do.';
comment on column admin_users.full_access is
  'Bypasses every individual permission check — full control, including managing other admin users.';
