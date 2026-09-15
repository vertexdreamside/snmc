-- Nationality field, new — genuinely missing from the schema entirely.
alter table people add column if not exists nationality text;

-- Service Category expansion — Education, Regulatory, Retired,
-- Unemployed added as real options alongside Hospital/Community/Private.
-- Deliberately scoped to the `people` table ONLY: candidates and
-- councillor_terms each have their OWN separate service_category check
-- constraint, and those must stay restricted to Hospital/Community/
-- Private — that's the field that actually drives the Hospital-votes-
-- Hospital / Community-votes-Community voting-pool restriction
-- confirmed earlier. Widening those two would let a non-workplace value
-- end up on a ballot entry, which has no defined voting-pool meaning.
-- lib/auth/eligibility.ts's serviceCategoryMatches() already treats
-- anything outside ('Hospital','Community','Private') as unrestricted
-- (eligible for all pools) without any code change needed — these four
-- new values fall into that existing fallback correctly.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'people'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%service_category%';
  if cname is not null then
    execute format('alter table people drop constraint %I', cname);
  end if;
end $$;

alter table people add constraint people_service_category_check
  check (service_category in ('Hospital','Community','Private','Unspecified','Education','Regulatory','Retired','Unemployed'));
