"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name", last_name: "Last Name", sex: "Sex", date_of_birth: "Date of Birth",
  nin: "NIN", address_line1: "Address Line 1", address_line2: "Address Line 2", address_line3: "Address Line 3",
  phone_home: "Home Phone", phone_mobile: "Mobile", employer: "Employer", place_of_work: "Place of Work",
  employment_sector: "Employment Sector", service_category: "Service Category", training_institute: "Training Institute",
  nurse_license_no: "Nurse Licence No.", nurse_license_expiry: "Nurse Licence Expiry",
  midwife_license_no: "Midwife Licence No.", midwife_license_expiry: "Midwife Licence Expiry",
};

function display(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(empty)";
  return String(v);
}

export function PendingApprovalRow({
  person,
  change,
}: {
  person: { id: string; first_name: string; last_name: string; nurse_reg_no: string | null; midwife_reg_no: string | null };
  change?: { changes: Record<string, { from: unknown; to: unknown }>; reason?: string; at: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingAction, setPendingAction] = useState<"Approved" | "Rejected" | null>(null);

  async function confirmStatus(status: "Approved" | "Rejected") {
    setBusy(true);
    await fetch(`/api/admin/people/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: status === "Approved" ? "approve" : "reject", comment: comment || undefined }),
    });
    setBusy(false);
    setPendingAction(null);
    setComment("");
    router.refresh();
  }

  const changeEntries = change ? Object.entries(change.changes) : [];

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <Link href={`/admin/register/${person.id}`} className="font-body text-sm font-medium text-council-navy underline">
          {person.first_name} {person.last_name}
        </Link>
        <span className="font-body text-xs text-council-ink/50">{person.nurse_reg_no || person.midwife_reg_no || "—"}</span>
      </div>

      {change?.reason && (
        <p className="font-body text-xs text-council-ink/60 italic mb-2">"{change.reason}"</p>
      )}

      {changeEntries.length > 0 ? (
        <div className="bg-council-cream rounded-card p-3 mb-3 space-y-1">
          {changeEntries.map(([field, { from, to }]) => (
            <p key={field} className="font-body text-xs text-council-ink/70">
              <span className="font-medium">{FIELD_LABELS[field] ?? field}:</span>{" "}
              <span className="line-through text-council-ink/40">{display(from)}</span> → <span className="text-council-navy">{display(to)}</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="font-body text-xs text-council-ink/40 mb-3 italic">No self-service change on file — may be a new import or an admin-side flag.</p>
      )}

      {pendingAction ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={pendingAction === "Approved" ? "Comment (visible to the person, optional)" : "Reason for rejection (visible to the person) — required"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 text-xs border border-council-navy/20 rounded-card px-2 py-1.5"
          />
          <button
            onClick={() => confirmStatus(pendingAction)}
            disabled={busy || (pendingAction === "Rejected" && !comment.trim())}
            className={`text-xs rounded-card px-3 py-1.5 text-white disabled:opacity-60 ${pendingAction === "Approved" ? "bg-status-active" : "bg-status-closed"}`}
          >
            Confirm {pendingAction}
          </button>
          <button onClick={() => setPendingAction(null)} className="text-xs text-council-ink/50 underline">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setPendingAction("Approved")} disabled={busy} className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">
            Approve
          </button>
          <button onClick={() => setPendingAction("Rejected")} disabled={busy} className="text-xs border border-status-closed/40 text-status-closed rounded-card px-3 py-1.5 disabled:opacity-60">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
