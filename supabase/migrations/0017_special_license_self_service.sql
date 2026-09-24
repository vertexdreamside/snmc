-- Section 13.7/13.8 of the confirmed portal UX requirements: a
-- nurse/midwife should be able to submit their OWN special licence,
-- going through the same approval workflow as any other profile
-- change — not immediately applied like an admin-added one.

alter table special_licenses add column if not exists status text not null default 'Approved' check (status in ('Pending','Approved','Rejected'));
alter table special_licenses add column if not exists source text not null default 'admin' check (source in ('self','admin'));
alter table special_licenses add column if not exists notes text;
alter table special_licenses add column if not exists reviewed_by uuid references admin_users(id);
alter table special_licenses add column if not exists reviewed_at timestamptz;
alter table special_licenses add column if not exists review_comment text;

comment on column special_licenses.status is
  'Admin-added rows default to Approved (an admin entering this has already reviewed it). Self-submitted rows start Pending and require admin review, same as any other self-service profile change.';
