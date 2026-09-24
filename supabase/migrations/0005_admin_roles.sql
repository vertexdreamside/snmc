-- Extends admin_users beyond the original four staff roles (Super Admin,
-- Registration Officer, Election Officer, Read Only) to cover Council-level
-- and organizational oversight roles: Minister, Supervisor, Manager.
--
-- Permission scope for these three is a reasonable starting default, NOT
-- something the Council has confirmed — see the comment in
-- lib/auth/guards.ts and the README for exactly what each can currently
-- do, and revisit once the Council specifies real requirements.

alter table admin_users drop constraint admin_users_role_check;
alter table admin_users add constraint admin_users_role_check
  check (role in ('Super Admin','Registration Officer','Election Officer','Read Only','Minister','Supervisor','Manager'));

-- Also widen the role helper's dependent policies implicitly — no RLS
-- changes needed here since existing policies check auth_admin_role() is
-- not null (any admin role) or specific role lists at the application
-- layer (requireAdmin() calls in route handlers), not in SQL.
