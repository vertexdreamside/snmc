-- SNMC Council Voting & Registration Platform — initial schema
-- Mirrors Section 5 of the build spec, plus RLS policies per Section 9.
-- Login is Registration Number + NIN only (no OTP/second factor) — see
-- lib/auth/identify.ts for the trade-off note.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Core person record (nurse and/or midwife)
-- ---------------------------------------------------------------------
create table people (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique, -- null until they first log in / are provisioned
  first_name text not null,
  last_name text not null,
  sex text check (sex in ('M','F','Unknown')),
  date_of_birth date,
  nin text,                          -- National ID Number — access-restricted, see RLS below
  address_line1 text,
  address_line2 text,
  address_line3 text,
  phone_home text,
  phone_mobile text,

  nurse_reg_no text unique,
  midwife_reg_no text unique,
  professional_category text check (professional_category in ('Nurse','Midwife','Both')),

  training_institute text,
  employer text,
  place_of_work text,
  employment_sector text check (employment_sector in ('Government','Private')),
  service_category text check (service_category in ('Hospital','Community','Private','Unspecified')),

  nurse_license_no text,
  nurse_license_expiry date,
  nurse_license_renewed date,
  midwife_license_no text,
  midwife_license_expiry date,
  midwife_license_renewed date,

  registration_status text check (registration_status in
    ('Practising','Not Practising','Retired','Abroad','Deceased','Deleted','Unknown')) default 'Unknown',
  is_active boolean default false,

  profile_status text check (profile_status in ('Approved','Pending Review','Rejected')) default 'Pending Review',

  data_source text,                  -- provenance: 'Access DB', 'Word Register', 'Self-Registered', 'Admin Added'
  notes text,                        -- admin-only, never exposed to the person themselves

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Deliberately excluded: ethnicity, marital status. Present in the legacy
-- Access data but not required for voting/licence verification and
-- unnecessarily sensitive to carry forward — confirm with Council before
-- reintroducing either (build spec Section 10, item 6).

comment on column people.nin is 'National ID Number — never select this column in a client-facing or portal-user query. Service-role access only.';

create index idx_people_nurse_reg on people (nurse_reg_no);
create index idx_people_midwife_reg on people (midwife_reg_no);
create index idx_people_status on people (registration_status);

create table people_emails (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  email text not null
);

create table advanced_education (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  type text,
  level text,
  start_date date,
  end_date date,
  place_of_study text
);

create table specialities (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table person_specialities (
  person_id uuid references people(id) on delete cascade,
  speciality_id uuid references specialities(id) on delete cascade,
  registration_no text,
  date_of_registration date,
  primary key (person_id, speciality_id)
);

-- ---------------------------------------------------------------------
-- Elections
-- ---------------------------------------------------------------------
create table elections (
  id uuid primary key default gen_random_uuid(),
  term_label text not null,
  status text check (status in ('Planned','Round 1 Open','Round 1 Closed','Round 2 Open','Round 2 Closed','Completed')) default 'Planned',
  round1_open_at timestamptz,
  round1_close_at timestamptz,
  round2_open_at timestamptz,
  round2_close_at timestamptz,
  results_published boolean default false
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references elections(id) on delete cascade,
  person_id uuid references people(id),
  category text check (category in ('Nurse','Midwife')),
  service_category text check (service_category in ('Hospital','Community','Private')),
  nominated_by uuid references people(id),
  round int not null default 1,
  status text check (status in ('Nominated','Shortlisted','Elected','Not Elected')) default 'Nominated'
);

-- Voting participation record — WHO voted, kept separate from WHAT they voted for
create table vote_participation (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references elections(id),
  round int not null,
  category text check (category in ('Nurse','Midwife')),
  voter_id uuid references people(id),
  voted_at timestamptz default now(),
  unique (election_id, round, category, voter_id)
);

-- The actual ballot — no link back to voter_id, preserving anonymity
create table ballots (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references elections(id),
  round int not null,
  category text check (category in ('Nurse','Midwife')),
  candidate_id uuid references candidates(id),
  cast_at timestamptz default now()
);

-- QR licence verification tokens
create table licence_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id),
  token text unique not null,
  issued_at timestamptz default now(),
  revoked boolean default false
);

-- Councillor terms — grants Councillor Portal access for the duration of a term
create table councillor_terms (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id),
  election_id uuid references elections(id),
  category text check (category in ('Nurse','Midwife')),
  appointment_type text check (appointment_type in ('Elected','Appointed')),
  service_category text check (service_category in ('Hospital','Community','Private')),
  term_start date,
  term_end date,
  is_active boolean default true
);

-- Admin roles (Staff Portal — Section 6)
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique,
  role text check (role in ('Super Admin','Registration Officer','Election Officer','Read Only')),
  full_name text
);

-- Audit log
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------
alter table people enable row level security;
alter table people_emails enable row level security;
alter table advanced_education enable row level security;
alter table person_specialities enable row level security;
alter table elections enable row level security;
alter table candidates enable row level security;
alter table vote_participation enable row level security;
alter table ballots enable row level security;
alter table licence_qr_tokens enable row level security;
alter table councillor_terms enable row level security;
alter table admin_users enable row level security;
alter table audit_log enable row level security;

-- Helper: is the current auth user an admin, and with which role?
create or replace function auth_admin_role() returns text as $$
  select role from admin_users where auth_user_id = auth.uid();
$$ language sql stable security definer;

-- people: a person can read/update their own row; admins can read/update
-- any row per role; nobody can read another person's row directly.
create policy "people_self_select" on people
  for select using (auth_user_id = auth.uid());
create policy "people_self_update" on people
  for update using (auth_user_id = auth.uid());
create policy "people_admin_all" on people
  for all using (auth_admin_role() is not null);

-- Councillor Portal read access to a *limited* public-safe view is handled
-- via the `council_roster` view below, not by widening this table's policy.

-- elections: readable by anyone signed in (portal, council, or admin);
-- writes restricted to Election Officer / Super Admin.
create policy "elections_read_authenticated" on elections
  for select using (auth.uid() is not null);
create policy "elections_admin_write" on elections
  for all using (auth_admin_role() in ('Election Officer','Super Admin'));

-- candidates: readable once nominated/shortlisted; managed by admins.
create policy "candidates_read_authenticated" on candidates
  for select using (auth.uid() is not null);
create policy "candidates_admin_write" on candidates
  for all using (auth_admin_role() in ('Election Officer','Super Admin'));

-- vote_participation: a person can see only that *they* voted, never the
-- full list (that view is admin-only, for turnout monitoring).
create policy "participation_self_select" on vote_participation
  for select using (voter_id = (select id from people where auth_user_id = auth.uid()));
create policy "participation_admin_select" on vote_participation
  for select using (auth_admin_role() is not null);
-- Inserts happen via a service-role function (see app/api/vote/route.ts),
-- not directly from the client, so no client insert policy is defined here.

-- ballots: never directly selectable by client roles — tallying happens via
-- a service-role/admin RPC. No select policy = no client access.
create policy "ballots_admin_select" on ballots
  for select using (auth_admin_role() is not null);

-- licence_qr_tokens: a person manages their own; verification page uses the
-- service-role client, not this policy, to look up by token.
create policy "qr_tokens_self_select" on licence_qr_tokens
  for select using (person_id = (select id from people where auth_user_id = auth.uid()));
create policy "qr_tokens_admin_all" on licence_qr_tokens
  for all using (auth_admin_role() is not null);

-- councillor_terms: a person can see their own; admins manage all.
create policy "councillor_terms_self_select" on councillor_terms
  for select using (person_id = (select id from people where auth_user_id = auth.uid()));
create policy "councillor_terms_admin_all" on councillor_terms
  for all using (auth_admin_role() is not null);

-- admin_users: admins can see the admin list; only Super Admin manages it.
create policy "admin_users_read" on admin_users
  for select using (auth_admin_role() is not null);
create policy "admin_users_super_admin_write" on admin_users
  for all using (auth_admin_role() = 'Super Admin');

-- audit_log: admin-only read; inserts happen via service-role helper.
create policy "audit_log_admin_select" on audit_log
  for select using (auth_admin_role() is not null);

-- ---------------------------------------------------------------------
-- Council roster view — what the Councillor Portal actually reads from,
-- instead of widening RLS on `people`/`councillor_terms` themselves.
--
-- Deliberately created WITHOUT `security_invoker`: a Postgres view without
-- that option runs with the privileges of the view's owner and is NOT
-- subject to the base tables' RLS policies. Access is controlled instead
-- by the GRANT below plus an application-level check (requireCouncillor()
-- in lib/auth/guards.ts) that only lets current Councillors reach the page
-- that queries it. Do not add `security_invoker = true` here — doing so
-- would fall back to the base tables' row policies, and since Postgres
-- RLS policies are OR'd together, any select policy broad enough to serve
-- "the whole roster" would also apply to direct queries against
-- `councillor_terms`, exposing every term row to every signed-in user.
-- ---------------------------------------------------------------------
create view council_roster as
  select
    ct.id as term_id,
    p.first_name,
    p.last_name,
    ct.category,
    ct.appointment_type,
    ct.service_category,
    ct.term_start,
    ct.term_end
  from councillor_terms ct
  join people p on p.id = ct.person_id
  where ct.is_active = true;

grant select on council_roster to authenticated;
