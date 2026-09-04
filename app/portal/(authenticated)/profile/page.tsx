import { requirePortalUser } from "@/lib/auth/guards";
import { ProfileForm } from "./ProfileForm";

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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Your Details</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {person.first_name} {person.last_name}
        </p>
      </div>

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
          <dd>{person.professional_category ?? "—"}</dd>
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
