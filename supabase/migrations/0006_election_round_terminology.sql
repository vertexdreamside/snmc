-- Redefines what "Round 1" and "Round 2" mean, per the actual historical
-- process (Nomination_Paper_1st_Round_2012 / Nomination_Paper_2ND_Round
-- ballot form) and explicit direction: Round 1 = nominating a candidate,
-- Round 2 = the election (ballot vote) on those nominees. This REPLACES
-- the earlier model, where "Round 1" and "Round 2" were both voting
-- rounds (an initial vote, then a conditional re-vote/runoff) — that
-- model is dropped in favor of this simpler, historically-grounded one:
-- one nomination phase, one ballot phase, done.
--
-- Data migration first (in case any election rows already exist using
-- the old vocabulary), then the constraint is swapped to the new values.

update elections set status = 'Nomination Open' where status = 'Round 1 Open';
update elections set status = 'Nomination Closed' where status = 'Round 1 Closed';
update elections set status = 'Election Open' where status = 'Round 2 Open';
update elections set status = 'Completed' where status = 'Round 2 Closed';

alter table elections drop constraint elections_status_check;
alter table elections add constraint elections_status_check
  check (status in ('Planned','Nomination Open','Nomination Closed','Election Open','Election Closed','Completed'));

comment on column elections.status is
  'Planned: setup, before nominations open. Nomination Open/Closed: Round 1 — candidates are nominated (build spec Section 3, per the historical Nomination Form). Election Open/Closed: Round 2 — the actual ballot vote among nominees. Completed: results published.';
