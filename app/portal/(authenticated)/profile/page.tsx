import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import { categoryDisplay } from "@/lib/licenses";
import { AlertTriangle } from "lucide-react";

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
  const expiryWarning = upcomingExpiryWarning(person.nurse_license_expiry, person.midwife_license_expiry);
  const supabase = createClient();

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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Your Details</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {person.first_name} {person.last_name}
        </p>
      </div>

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

      <ProfileForm person={person} />
    </div>
  );
}
