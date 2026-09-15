-- Section 11: "If rejected, a rejection reason must be provided." The
-- document review action previously had no way to record why a
-- submitted licence document was rejected at all.
alter table license_documents add column if not exists review_comment text;
