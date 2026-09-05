-- Section 10 of the confirmed Elections & Voting module, explicitly
-- confirmed over the prior behavior: "Each eligible voter may
-- participate in Round 1 only once... Once a voter submits their
-- nomination, they cannot submit another nomination." This REPLACES the
-- previous model, which only prevented nominating the SAME person
-- twice — a voter could nominate any number of different people. Now a
-- voter gets exactly one nomination per election per category (Nurse
-- and Midwife are still separate — someone with both licences still
-- gets one nomination in each), matching the same one-vote-per-category
-- pattern Round 2 voting (vote_participation) already enforces.
--
-- Safety: if any nominator already has more than one nomination in the
-- same election/category under the OLD rules, adding this constraint
-- directly would fail outright. This keeps each nominator's EARLIEST
-- nomination (first-come basis — the order they actually acted in) and
-- removes the extras, decrementing nomination_count on the affected
-- candidates so the tally stays accurate. This is a real, visible data
-- correction, not a silent no-op — check the notice below after running
-- this if you have live elections with nominations already in progress.

do $$
declare
  extra record;
  removed_count int := 0;
begin
  for extra in
    select n.id, n.person_id, n.election_id, n.category
    from nominations n
    where n.id not in (
      select distinct on (election_id, category, nominated_by) id
      from nominations
      order by election_id, category, nominated_by, created_at asc
    )
  loop
    delete from nominations where id = extra.id;
    update candidates
      set nomination_count = greatest(0, nomination_count - 1)
      where election_id = extra.election_id and person_id = extra.person_id and category = extra.category;
    removed_count := removed_count + 1;
  end loop;

  if removed_count > 0 then
    raise notice 'Removed % extra nomination(s) submitted under the old multiple-nominations-per-voter rule, keeping each voter''s earliest nomination.', removed_count;
  end if;
end $$;

alter table nominations add constraint nominations_one_per_voter_per_category
  unique (election_id, category, nominated_by);
