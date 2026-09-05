-- Fixes a real gap: nominations were never actually counted. Two
-- different nurses nominating the same candidate created two separate,
-- unrelated-looking candidates rows — no way to tell they were the same
-- nominee, and nothing stopped the same nominator submitting the same
-- nomination twice to inflate a count. Needed before "auto-generate
-- ballot from top nominees" can mean anything real.

create table nominations (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references elections(id) on delete cascade,
  person_id uuid references people(id),
  category text check (category in ('Nurse','Midwife')),
  nominated_by uuid references people(id),
  current_placement_note text,
  created_at timestamptz default now(),
  unique (election_id, person_id, category, nominated_by)
);

alter table candidates add column if not exists nomination_count int not null default 1;

with ranked as (
  select id, election_id, person_id, category, nominated_by,
         row_number() over (partition by election_id, person_id, category order by id) as rn,
         count(*) over (partition by election_id, person_id, category) as dup_count
  from candidates
)
insert into nominations (election_id, person_id, category, nominated_by, created_at)
select election_id, person_id, category, nominated_by, now()
from ranked
where rn = 1
on conflict do nothing;

update candidates c
set nomination_count = sub.dup_count
from (
  select election_id, person_id, category, count(*) as dup_count
  from candidates
  group by election_id, person_id, category
) sub
where c.election_id = sub.election_id and c.person_id = sub.person_id and c.category = sub.category;

delete from candidates c
where exists (
  select 1 from candidates c2
  where c2.election_id = c.election_id
    and c2.person_id = c.person_id
    and c2.category = c.category
    and c2.id < c.id
);

alter table candidates add constraint candidates_election_person_category_key
  unique (election_id, person_id, category);

comment on column candidates.nomination_count is
  'How many distinct people nominated this candidate — maintained by the nominate API upsert. Drives auto-shortlisting by rank.';
