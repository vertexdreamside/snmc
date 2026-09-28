// Shared document-upload constraints — previously duplicated verbatim
// (same 10MB limit, same 4-type allowlist, same rejection wording) across
// six separate upload routes (portal license-document, portal name-change
// document, portal special-licenses document, admin special-licenses
// document, admin people license-document, and admin election
// approval-document). Consolidated here so the limit/allowlist only ever
// needs changing in one place, and so the four routes stay in lockstep
// instead of silently drifting apart.
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const UPLOAD_TOO_LARGE_MESSAGE = "File is too large (10MB max).";
export const UPLOAD_BAD_TYPE_MESSAGE = "Only PDF, JPEG, PNG, or WEBP files are accepted.";
