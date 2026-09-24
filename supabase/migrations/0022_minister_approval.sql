-- Section 25-26 of the confirmed Elections & Voting module: closing an
-- election does NOT publish results. Results → Council Review → Minister
-- Approval → Publication. Adds the approval chain as its own tracked
-- state, separate from results_published (which now can only ever be
-- set true once this chain reaches 'Approved').

alter table elections add column if not exists approval_status text not null default 'Not Required'
  check (approval_status in ('Not Required','Pending Approval','Approved','Disputed'));
alter table elections add column if not exists approved_by uuid references admin_users(id);
alter table elections add column if not exists approved_at timestamptz;
alter table elections add column if not exists approval_reference text;
alter table elections add column if not exists approval_notes text;

comment on column elections.approval_status is
  'Not Required until the election is Closed. Then Pending Approval → Approved (or Disputed, which blocks approval/publication entirely until resolved via election_disputes). results_published can only be set true when this is Approved — enforced in the API, not just by convention.';
