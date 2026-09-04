-- Adds an explicit confirmation gate for professional_category. The
-- underlying register data doesn't yet reliably distinguish which
-- registration numbers belong to Nurses vs Midwives — professional_category
-- as migrated is a best-effort guess, not a confirmed fact. Until now,
-- nomination and voting eligibility (Sections 3.2/4) trusted that field
-- directly, which would silently let someone nominate/vote in the wrong
-- category if the guess were wrong.
--
-- category_confirmed defaults to false for every existing and newly
-- imported record — nobody is nomination/vote-eligible until a Council
-- admin has explicitly reviewed and confirmed their category via
-- /admin/register/classify. This is a deliberately conservative default:
-- it blocks everyone until real review happens, rather than assuming the
-- current data is right.

alter table people add column category_confirmed boolean not null default false;

create index idx_people_category_unconfirmed on people (category_confirmed) where category_confirmed = false;

comment on column people.category_confirmed is
  'True once a Council admin has explicitly confirmed this person''s professional_category (Nurse/Midwife/Both) — see /admin/register/classify. Nomination and voting eligibility require this to be true; the raw professional_category value alone is not trusted.';
