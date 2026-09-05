import { History } from "lucide-react";

interface HistoryEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Registration/licence/approval/audit history (Section 2 of the platform
// requirements document) — this is literally the audit_log every admin
// action and self-service edit already writes to, not a separate history
// table. Covers approvals, rejections, field edits, licence document
// uploads/reviews, special licence changes, logins, and nominations —
// everything logged against this person from either direction.
const ACTION_LABELS: Record<string, string> = {
  self_service_profile_update: "Updated their own profile",
  admin_approved_profile: "Profile approved",
  admin_rejected_profile: "Profile rejected",
  admin_marked_deceased: "Marked deceased",
  admin_edited_fields: "Fields edited by admin",
  admin_added_special_license: "Special licence added",
  admin_removed_special_license: "Special licence removed",
  admin_uploaded_license_document: "Licence document uploaded",
  admin_reviewed_license_document: "Licence document reviewed",
  admin_created_person: "Record created",
  portal_login_success: "Signed in",
  portal_login_failure: "Failed sign-in attempt",
  nomination_submitted: "Nomination submitted",
  vote_cast: "Cast a vote",
};

const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name", last_name: "Last Name", sex: "Sex", date_of_birth: "Date of Birth",
  nin: "NIN", address_line1: "Address Line 1", phone_home: "Home Phone", phone_mobile: "Mobile",
  employer: "Employer", place_of_work: "Place of Work", employment_sector: "Employment Sector",
  service_category: "Service Category", training_institute: "Training Institute",
  nurse_license_no: "Nurse Licence No.", nurse_license_expiry: "Nurse Licence Expiry",
  midwife_license_no: "Midwife Licence No.", midwife_license_expiry: "Midwife Licence Expiry",
};

function display(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(empty)";
  return String(v);
}

export function HistorySection({ entries }: { entries: HistoryEntry[] }) {
  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <h2 className="font-display text-base text-council-navy mb-4 flex items-center gap-2">
        <History size={16} className="text-council-cyan" aria-hidden="true" /> History
      </h2>
      {entries.length === 0 ? (
        <p className="font-body text-sm text-council-ink/40">No history recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const changes = entry.details?.changes as Record<string, { from: unknown; to: unknown }> | undefined;
            return (
              <li key={entry.id} className="border-l-2 border-council-navy/10 pl-3">
                <p className="font-body text-sm text-council-navy">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </p>
                <p className="font-body text-xs text-council-ink/40">{new Date(entry.created_at).toLocaleString()}</p>
                {changes && Object.keys(changes).length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(changes).map(([field, { from, to }]) => (
                      <p key={field} className="font-body text-xs text-council-ink/60">
                        <span className="font-medium">{FIELD_LABELS[field] ?? field}:</span>{" "}
                        <span className="line-through text-council-ink/30">{display(from)}</span> →{" "}
                        <span>{display(to)}</span>
                      </p>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
