-- Adds configurable round durations (Section: "Round 1 Nomination closes
-- for two weeks... Round 2 Election opens for one week") and lets a
-- nomination record which sector it's for.

alter table elections add column if not exists nomination_duration_days int not null default 14;
alter table elections add column if not exists voting_duration_days int not null default 7;

comment on column elections.nomination_duration_days is
  'How long Round 1 (Nomination) stays open once opened — default 14 days, per confirmed rules ("closes for two weeks so council can do admin work"). Applied automatically to round1_close_at when the election is advanced to Nomination Open.';
comment on column elections.voting_duration_days is
  'How long Round 2 (Election) stays open once opened — default 7 days. Applied automatically to round2_close_at when the election is advanced to Election Open.';

-- Nominations already carry a category (Nurse/Midwife); this lets the
-- nominator also specify which sector (Hospital/Community/Private) the
-- nomination is for, matching the new service-category voting
-- restriction — without this, every nomination defaults to "eligible for
-- all pools," which doesn't reflect the nominee's actual sector.
alter table nominations add column if not exists service_category text check (service_category in ('Hospital','Community','Private'));
