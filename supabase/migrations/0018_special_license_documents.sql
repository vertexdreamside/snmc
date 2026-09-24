-- Section 12: "+ Upload Special Licence" — extends the existing
-- document upload/storage pattern (license_documents) to special
-- licences specifically, which previously had no document support at
-- all (the earlier special-licence self-service form explicitly noted
-- this gap).

alter table special_licenses add column if not exists document_path text;
alter table special_licenses add column if not exists document_uploaded_by text check (document_uploaded_by in ('self','admin'));
alter table special_licenses add column if not exists document_uploaded_at timestamptz;
