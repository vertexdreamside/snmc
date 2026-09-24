-- Section 13: "Preferably make the age ranges configurable by an
-- authorised administrator." Replaces the previously hardcoded, fixed
-- brackets (Under 30/30-39/40-49/50-59/60+) with a real, editable table —
-- seeded with the ranges from the confirmed example (Under 20, 20-29,
-- 30-39, 40-49, 50-59, 60-69, 70+) as sensible defaults, not because
-- they're fixed going forward.

create table age_brackets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_age int not null,
  max_age int, -- null means "and over" (no upper bound)
  sort_order int not null
);

insert into age_brackets (label, min_age, max_age, sort_order) values
  ('Under 20', 0, 19, 1),
  ('20–29', 20, 29, 2),
  ('30–39', 30, 39, 3),
  ('40–49', 40, 49, 4),
  ('50–59', 50, 59, 5),
  ('60–69', 60, 69, 6),
  ('70+', 70, null, 7);

alter table age_brackets enable row level security;
create policy "age_brackets_read_all" on age_brackets for select using (true);
create policy "age_brackets_admin_write" on age_brackets for all using (auth_admin_role() is not null);
