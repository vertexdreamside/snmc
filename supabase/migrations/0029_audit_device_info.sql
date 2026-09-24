-- Section 7: device/browser/OS information in the audit trail, parsed
-- from the standard User-Agent header already present on every request.
alter table audit_log add column if not exists device_type text;
alter table audit_log add column if not exists browser text;
alter table audit_log add column if not exists operating_system text;
