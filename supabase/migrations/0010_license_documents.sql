-- Real license document upload/verification — previously the register
-- only had a licence NUMBER as a free-text field, no way to see or
-- verify the underlying certificate. Makes "Confirm Categories" into a
-- genuine License Approval workflow.

create table license_documents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  license_type text not null check (license_type in ('Nurse','Midwife')),
  file_path text not null,
  original_filename text,
  uploaded_by uuid,
  uploaded_by_role text check (uploaded_by_role in ('self','admin')),
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  reviewed_by uuid references admin_users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index license_documents_person_idx on license_documents(person_id);

insert into storage.buckets (id, name, public)
values ('license-documents', 'license-documents', false)
on conflict (id) do nothing;

alter table license_documents enable row level security;

create policy "people can view their own license documents"
  on license_documents for select
  using (person_id in (select id from people where auth_user_id = auth.uid()));

create policy "people can insert their own license documents"
  on license_documents for insert
  with check (person_id in (select id from people where auth_user_id = auth.uid()));
