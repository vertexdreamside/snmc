-- Sections 15-17: Admin Users and Councillors as two distinct,
-- separately-managed lists. The underlying account mechanism
-- (permissions, secure invite-link creation, disable/enable) already
-- works identically for both — this just tags which list a person
-- belongs in and which display they show up on.

alter table admin_users add column if not exists user_type text not null default 'Admin' check (user_type in ('Admin','Councillor'));
alter table admin_users add column if not exists phone text;

comment on column admin_users.user_type is
  'Which of the two separately-managed lists this account belongs to — Admin Users or Councillors. Both use the same underlying permission/invite/disable mechanism; this only controls where they display.';
