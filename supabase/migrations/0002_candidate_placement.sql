-- Adds the "Current Placement" field from the historical paper Nomination
-- Form (filled in by the nominator at nomination time, which may differ
-- from — or predate an update to — the candidate's place_of_work already
-- on file). Kept as a separate migration rather than editing 0001, since
-- 0001 may already be applied against a live project.

alter table candidates add column current_placement_note text;
