-- Formal dispute and recount workflow. A "recount" here can't mean
-- re-counting physical paper ballots — it means re-running the tally
-- query independently and comparing it against what was recorded at the
-- time the dispute was filed, producing an auditable, timestamped
-- confirmation (or contradiction) rather than just trusting the same
-- number twice.

create table election_disputes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references elections(id) on delete cascade,
  category text not null check (category in ('Nurse','Midwife')),
  filed_by uuid references admin_users(id),
  reason text not null,
  status text not null default 'Open' check (status in ('Open','Recounting','Resolved')),
  original_tally jsonb,          -- snapshot of per-candidate vote counts at filing time
  recount_tally jsonb,           -- snapshot from the independent recount, once run
  recount_matches boolean,       -- whether original_tally and recount_tally agree exactly
  resolution text check (resolution in ('Upheld','Rejected')),
  resolution_notes text,
  filed_at timestamptz default now(),
  recounted_at timestamptz,
  resolved_by uuid references admin_users(id),
  resolved_at timestamptz
);

create index election_disputes_election_idx on election_disputes(election_id);

comment on table election_disputes is
  'Formal disputes filed against an election''s results, with an independently re-run tally ("recount") compared against the original snapshot, and a final Upheld/Rejected resolution — a permanent, auditable record, not a quiet re-check.';
