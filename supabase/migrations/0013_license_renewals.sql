-- Section 5 of the platform requirements: a real renewal workflow, not
-- just manually changing an expiry date. Previously license_documents
-- covered upload/approval of a certificate image for category
-- confirmation, but there was no tracked "renewal request" — a proposed
-- new expiry date, pending review, with its own approval history and a
-- captured snapshot of what the expiry date was before the renewal.
--
-- Supports both renewal before expiry and after expiry — nothing here
-- requires the current licence to still be valid at submission time.

create table license_renewals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  license_type text not null check (license_type in ('Nurse','Midwife')),
  previous_expiry_date date,               -- snapshot at submission time, for history
  requested_expiry_date date not null,
  supporting_document_id uuid references license_documents(id),
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  submitted_at timestamptz default now(),
  reviewed_by uuid references admin_users(id),
  reviewed_at timestamptz,
  review_comment text
);

create index license_renewals_person_idx on license_renewals(person_id);
create index license_renewals_status_idx on license_renewals(status);

comment on table license_renewals is
  'Licence renewal requests — a proposed new expiry date pending Council review, distinct from just uploading a certificate document. Approving one updates the person''s actual licence expiry date; the row itself is retained permanently as renewal history.';
