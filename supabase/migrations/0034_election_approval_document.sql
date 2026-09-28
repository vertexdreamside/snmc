-- Requested addition: once Minister Approval is recorded on an election
-- (Council Review & Minister Approval — see ApprovalPanel.tsx), admins
-- need somewhere to attach the actual signed approval document as
-- supporting evidence. Mirrors the existing single-document-per-record
-- pattern already used for special_licenses (0018) rather than
-- introducing a new storage shape.

alter table elections add column if not exists approval_document_path text;
alter table elections add column if not exists approval_document_uploaded_by uuid;
alter table elections add column if not exists approval_document_uploaded_at timestamptz;
