-- Section 10 of the platform requirements explicitly lists IP address
-- ("where appropriate") as part of a complete audit trail. Added here
-- specifically for login events (success/failure, both portals) — that's
-- where IP genuinely matters for security investigation (spotting a
-- brute-force or account-takeover attempt), rather than mechanically
-- stamping it on every single administrative action regardless of
-- whether it adds anything.

alter table audit_log add column if not exists ip_address text;

comment on column audit_log.ip_address is
  'Captured for login success/failure events only (see lib/auth/identify.ts and app/api/admin/login-audit/route.ts) — null for other action types by design, not by omission.';
