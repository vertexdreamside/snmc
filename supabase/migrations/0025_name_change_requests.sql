-- Section 4: nurses/midwives must be able to request a name/surname
-- change (marriage, divorce, legal change, other), with supporting
-- documentation, admin approval, and the previous name retained in
-- history. The official name is NEVER changed until an admin actually
-- approves the request — this table is the pending request; applying
-- it (updating people.first_name/last_name) only happens on approval.

create table name_change_requests (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  previous_first_name text not null,
  previous_last_name text not null,
  requested_first_name text not null,
  requested_last_name text not null,
  reason text not null check (reason in ('Marriage','Divorce','Legal Change of Name','Other')),
  reason_notes text,
  document_path text,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  submitted_at timestamptz default now(),
  reviewed_by uuid references admin_users(id),
  reviewed_at timestamptz,
  review_comment text,
  applied_at timestamptz
);

create index name_change_requests_person_idx on name_change_requests(person_id);
create index name_change_requests_status_idx on name_change_requests(status);

comment on table name_change_requests is
  'Name/surname change requests — previous_first_name/previous_last_name are captured at submission time as a permanent historical record, independent of whatever people.first_name/last_name might later become through other edits. Approving a request is the ONLY path that ever updates the official name.';
