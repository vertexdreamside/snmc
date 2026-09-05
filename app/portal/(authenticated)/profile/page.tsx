import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import { categoryDisplay } from "@/lib/licenses";
import { AlertTriangle } from "lucide-react";
import { RenewalRequestForm } from "./RenewalRequestForm";

const REMINDER_WINDOW_DAYS = 90;

// In-app licence expiry reminder — the closest thing to "email reminders"
// this system can currently do. There's no real email/SMS on file for
// most nurses/midwives (see the note on nominee notifications for the
// same underlying constraint), so this surfaces the moment the person
// actually logs in instead.
function upcomingExpiryWarning(nurseExpiry: string | null, midwifeExpiry: string | null): { label: string; date: string; expired: boolean } | null {
  const today = new Date();
  const windowEnd = new Date(today.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const candidates: { label: string; date: string }[] = [];
  if (nurseExpiry) candidates.push({ label: "Nurse licence", date: nurseExpiry });
  if (midwifeExpiry) candidates.push({ label: "Midwife licence", date: midwifeExpiry });
  const soonest = candidates
    .filter((c) => new Date(c.date) <= windowEnd)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!soonest) return null;
  return { ...soonest, expired: new Date(soonest.date) < today };
}

// Full self-service profile: a nurse/midwife sees and can edit everything
// about their own record except their registration numbers, which stay
// locked to the register itself (per explicit direction — those aren't
// personal details, they're the register's own identifiers). The
// administrative/verification fields (registration status, profile
// approval status, category confirmation) are also locked — not because
// of that same instruction, but because letting a signed-in person write
// those directly was a real security bug fixed in migration 0003; they're
// shown here read-only so the person can still see where things stand.
export default async function ProfilePage() {
  const person = await requirePortalUser();
  const supabase = createClient();

  // Only ever checked as a boolean, never fetched or shown as a value —
  // this determines whether NIN can be skipped this time (Section 13.4:
  // NIN is mandatory before the profile is "complete," but someone who
  // already has one on file shouldn't be forced to re-type it on every
  // unrelated edit).
  const { data: ninCheck } = await supabase.from("people").select("nin").eq("id", person.id).single();
  const hasNinOnFile = !!ninCheck?.nin && ninCheck.nin.trim() !== "";

  const { data: specialLicenses } = await supabase
    .from("special_licenses")
    .select("id, license_name, license_number, issued_date, expiry_date, status, source, document_path")
    .eq("person_id", person.id)
    .order("created_at", { ascending: false });

  const expiryWarning = upcomingExpiryWarning(person.nurse_license_expiry, person.midwife_license_expiry);

  // Most recent admin decision on this person's own profile, with its
  // review comment — a rejected edit with no explanation gives someone
  // no way to know what to fix. If comments should be admin-only
  // instead, remove this fetch/display rather than the comment field
  // itself (see app/api/admin/people/[id]/route.ts's note on this).
  const { data: latestReview } = await supabase
    .from("audit_log")
    .select("action, details, created_at")
    .eq("target_id", person.id)
    .in("action", ["admin_approved_profile", "admin_rejected_profile"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Section 13.8: per-field pending status ("NIN: Change submitted –
  // Pending Approval") rather than one blanket status. Only meaningful
  // while profile_status is still Pending Review — once approved or
  // rejected, latestReview above already covers the outcome.
  let pendingFields: string[] = [];
  if (person.profile_status === "Pending Review") {
    const { data: pendingEdit } = await supabase
      .from("audit_log")
      .select("details")
      .eq("target_id", person.id)
      .eq("action", "self_service_profile_update")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    pendingFields = pendingEdit?.details?.changes ? Object.keys(pendingEdit.details.changes) : [];
  }
  const pendingSpecialLicenses = (specialLicenses ?? []).filter((l) => l.status === "Pending" && l.source === "self");

  // Section 13.10: what's missing for the profile to be considered
  // complete/up to date — matches the Council dashboard's own
  // "Category Not Confirmed" style of counting real gaps, not a
  // cosmetic percentage.
  const missingItems: string[] = [];
  if (!hasNinOnFile) missingItems.push("NIN has not been provided");
  if (!person.category_confirmed) missingItems.push("Nurse/Midwife category not yet confirmed by the Council");
  if (!person.employer) missingItems.push("Employer information is missing");
  if (!person.place_of_work) missingItems.push("Place of work is missing");
  const profileComplete = missingItems.length === 0;

  const FIELD_LABELS: Record<string, string> = {
    first_name: "First Name", last_name: "Last Name", sex: "Sex", date_of_birth: "Date of Birth", nin: "NIN",
    address_line1: "Address", phone_home: "Home Phone", phone_mobile: "Mobile", employer: "Employer",
    place_of_work: "Place of Work", employment_sector: "Employment Sector", service_category: "Service Category",
    training_institute: "Training Institute",
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Your Details</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {person.first_name} {person.last_name}
        </p>
      </div>

      <section className={`rounded-card p-4 border ${profileComplete ? "bg-status-active/5 border-status-active/20" : "bg-status-pending/5 border-status-pending/20"}`}>
        <p className="font-body text-sm font-medium text-council-navy">
          {profileComplete ? "🟢 Profile Up to Date" : "🟠 Profile Requires Update"}
        </p>
        {!profileComplete && (
          <ul className="mt-2 space-y-0.5">
            {missingItems.map((item) => (
              <li key={item} className="font-body text-xs text-council-ink/60">• {item}</li>
            ))}
          </ul>
        )}
      </section>

      {(pendingFields.length > 0 || pendingSpecialLicenses.length > 0) && (
        <section className="bg-council-cyan/5 border border-council-cyan/20 rounded-card p-4">
          <p className="font-body text-sm font-medium text-council-navy mb-2">Pending Changes</p>
          <ul className="space-y-0.5">
            {pendingFields.map((field) => (
              <li key={field} className="font-body text-xs text-council-ink/60">
                <span className="font-medium">{FIELD_LABELS[field] ?? field}:</span> Change submitted – Pending Approval
              </li>
            ))}
            {pendingSpecialLicenses.map((l) => (
              <li key={l.id} className="font-body text-xs text-council-ink/60">
                <span className="font-medium">Special Licence ({l.license_name}):</span> New licence submitted – Pending Approval
              </li>
            ))}
          </ul>
        </section>
      )}

      {expiryWarning && (
        <section className={`rounded-card p-4 border ${expiryWarning.expired ? "bg-status-closed/10 border-status-closed/30" : "bg-status-pending/10 border-status-pending/30"}`}>
          <p className="font-body text-sm text-council-navy font-medium flex items-center gap-2">
            <AlertTriangle size={14} className={expiryWarning.expired ? "text-status-closed" : "text-status-pending"} aria-hidden="true" />
            {expiryWarning.expired
              ? `Your ${expiryWarning.label} expired on ${expiryWarning.date}.`
              : `Your ${expiryWarning.label} expires on ${expiryWarning.date}.`}
          </p>
          <p className="font-body text-xs text-council-ink/60 mt-1">Contact the Council office to renew.</p>
        </section>
      )}

      {latestReview && person.profile_status === "Rejected" && (
        <section className="bg-status-closed/10 border border-status-closed/30 rounded-card p-4">
          <p className="font-body text-sm text-council-navy font-medium mb-1">Your last change was rejected</p>
          {latestReview.details?.comment ? (
            <p className="font-body text-sm text-council-ink/70">"{latestReview.details.comment}"</p>
          ) : (
            <p className="font-body text-sm text-council-ink/50 italic">No comment was left explaining why.</p>
          )}
        </section>
      )}

      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-base text-council-navy mb-1">Registration (set by the Council)</h2>
        <p className="font-body text-xs text-council-ink/50 mb-4">
          These come from the register itself — contact the Council office if any of these need correcting.
        </p>
        <dl className="grid grid-cols-2 gap-y-2 font-body text-sm">
          <dt className="text-council-ink/50">Nurse Reg. No.</dt>
          <dd>{person.nurse_reg_no || "—"}</dd>
          <dt className="text-council-ink/50">Midwife Reg. No.</dt>
          <dd>{person.midwife_reg_no || "—"}</dd>
          <dt className="text-council-ink/50">Category</dt>
          <dd>{categoryDisplay(person.professional_category)}</dd>
          <dt className="text-council-ink/50">Registration Status</dt>
          <dd>{person.registration_status}</dd>
          <dt className="text-council-ink/50">Profile Status</dt>
          <dd>{person.profile_status}</dd>
        </dl>
      </section>

      <RenewalRequestForm hasNurse={!!person.nurse_reg_no} hasMidwife={!!person.midwife_reg_no} />

      <ProfileForm person={person} specialLicenses={specialLicenses ?? []} hasNinOnFile={hasNinOnFile} />
    </div>
  );
}
