-- people_emails had row-level security ENABLED (migration 0001) but no
-- policies were ever actually defined for it. In Postgres, RLS enabled
-- with zero policies means ALL access is denied by default — so a
-- person reading their own email via the normal (non-service-role)
-- client, as the portal profile page does, would always get nothing
-- back, even when a real row exists. This adds the same self-access
-- pattern already used on the people table itself.

create policy "people_emails_self_select" on people_emails
  for select using (
    person_id in (select id from people where auth_user_id = auth.uid())
  );

create policy "people_emails_admin_all" on people_emails
  for all using (auth_admin_role() is not null);
