-- Closes a real gap in 0001: `people_self_update` allowed a signed-in
-- person to UPDATE ANY column on their own row via a direct client write —
-- including registration_status, is_active, profile_status, nurse_reg_no,
-- midwife_reg_no, and nin. Postgres RLS `using` clauses gate rows, not
-- columns, so there was no way to say "only these fields" at the policy
-- level without a trigger.
--
-- Fix: remove direct client self-update entirely. All profile edits now
-- go through POST /api/portal/profile, which runs server-side with the
-- service-role client, whitelists exactly which columns a person may
-- change, and always forces profile_status back to 'Pending Review' so
-- edits still require admin approval — matching the "self-registration
-- lands in a pending-verification queue" requirement from the original
-- spec (Section 4), which this policy had accidentally let people bypass.

drop policy "people_self_update" on people;

-- people_self_select (read-only) and people_admin_all are unaffected and
-- still stand.
