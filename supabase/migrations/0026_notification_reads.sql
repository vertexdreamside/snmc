-- Section 6: "Mark the notification as read once reviewed." The
-- underlying pending items already exist across several tables
-- (people, license_documents, license_renewals, special_licenses,
-- name_change_requests) — this deliberately does NOT duplicate that
-- data into a new "notifications" table (which would drift out of sync
-- the moment an item is approved/rejected elsewhere). Instead this only
-- tracks READ STATE, per admin, keyed by a synthetic id built from the
-- item's own table+id — the actual notification list is computed live
-- from the real pending items each time the dashboard loads.

create table notification_reads (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admin_users(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz default now(),
  unique (admin_id, notification_key)
);

create index notification_reads_admin_idx on notification_reads(admin_id);

comment on table notification_reads is
  'Tracks which pending-approval notifications a given admin has marked read — the notification content itself is always computed live from the real underlying tables, never stored here.';
