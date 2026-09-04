-- Implements the Council's formally confirmed election rules document.
-- Several of these are CORRECTIONS to how the system currently behaves.

-- 1. Voter eligibility (Section 4/13/14) — CORRECTION: eligibility
-- previously checked registration_status = 'Practising', which the
-- confirmed rules explicitly forbid (Retired/Non-Active must be
-- eligible; only Deceased disqualifies). is_deceased is now the
-- separate, sole eligibility gate.
alter table people add column if not exists is_deceased boolean not null default false;
update people set is_deceased = true where registration_status = 'Deceased';

comment on column people.is_deceased is
  'The ONLY eligibility gate for nomination/voting per the confirmed election rules — Active, Retired, and Non-Active are all eligible; only this flag disqualifies.';

-- 2. Nominee acceptance workflow (Section 3) — 'Shortlisted' is replaced
-- by the Council's own terminology: 'Pending' (awaiting accept/decline),
-- then 'Accepted' or 'Declined'/'Removed'. Only 'Accepted' candidates
-- appear on the Round 2 ballot.
alter table candidates drop constraint if exists candidates_status_check;
alter table candidates add constraint candidates_status_check
  check (status in ('Nominated','Pending','Accepted','Declined','Removed','Elected','Not Elected'));

update candidates set status = 'Pending' where status = 'Shortlisted';

alter table candidates add column if not exists replaced_by uuid references candidates(id);
alter table candidates add column if not exists decision_recorded_at timestamptz;
alter table candidates add column if not exists decision_recorded_by uuid references admin_users(id);

-- 3. Configurable live-results visibility (Section 9)
alter table elections add column if not exists live_results_visible boolean not null default false;
comment on column elections.live_results_visible is
  'Per-election admin setting — whether per-candidate vote totals are visible to ADMINS while voting is open. Has nothing to do with what a voter sees — voters are gated exclusively by results_published, never this flag.';

-- 4. Election extension tracking (Section 10) — round1_close_at and
-- round2_close_at already exist from migration 0001 (they were already
-- the "Nomination closes" / "Voting closes" fields, just not yet wired
-- up to an extension UI/audit flow). No new columns needed here.
