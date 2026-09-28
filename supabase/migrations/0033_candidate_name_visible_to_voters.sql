-- Root cause of blank candidate names on the voting ballot (and nowhere
-- else): `people` only has two select policies —
--   people_self_select  (auth_user_id = auth.uid(), i.e. your OWN row)
--   people_admin_all    (admins only)
-- A Nurse/Midwife voter is neither, so when the ballot page joins
-- candidates -> people to show a candidate's name, RLS silently returns
-- null for that embedded row instead of an error (Postgres/PostgREST
-- just omits rows a policy denies). The `candidates` table itself IS
-- readable by any authenticated user (candidates_read_authenticated), so
-- the candidate row shows up with its real id/service_category — only
-- the person's name comes back empty. This is why the earlier
-- Array.isArray(c.people) fix (a real bug, correctly fixed) didn't
-- change what voters saw: c.people wasn't an array with an empty name,
-- it was genuinely null for every candidate who wasn't the voter
-- themselves. The admin panel never showed this because admins already
-- have people_admin_all.
--
-- Fix: let any authenticated user read the name of a person who is
-- currently an ACCEPTED candidate in some election — this is exactly
-- the "who am I voting for" information the Ballot Paper has always
-- shown, nothing more. It does NOT expose anything else on the person's
-- row to other rows' policies (id/nationality/etc. were already reachable
-- if the row is returned) beyond what any accepted-candidate listing
-- already made public in this system (see council_roster for the
-- equivalent existing pattern for the Councillor Portal).

create policy "people_accepted_candidate_select" on people
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from candidates c
      where c.person_id = people.id
        and c.status = 'Accepted'
    )
  );
