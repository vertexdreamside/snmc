-- Special licences: additional specialised certifications a nurse or
-- midwife may hold beyond their base Nurse/Midwife registration (e.g.
-- Critical Care, Anaesthetic, Public Health) — a person can hold
-- several, so this is its own table rather than more columns on people.

create table special_licenses (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  license_name text not null,
  license_number text,
  issued_date date,
  expiry_date date,
  created_at timestamptz default now(),
  created_by uuid references admin_users(id)
);

create index special_licenses_person_idx on special_licenses(person_id);

comment on table special_licenses is
  'Additional specialised licences/certifications beyond the base Nurse/Midwife registration — a person may hold multiple.';
