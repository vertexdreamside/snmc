import { requirePortalUser } from "@/lib/auth/guards";
import { ProfileForm } from "./ProfileForm";

// KYC / profile self-service, per build spec Section 4. Registration
// number, NIN, and status fields are intentionally not editable here —
// see migration 0003 for why that's enforced server-side, not just by
// leaving inputs out of this form.
export default async function ProfilePage() {
  const person = await requirePortalUser();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Your Profile</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {person.first_name} {person.last_name} · {person.nurse_reg_no || person.midwife_reg_no}
        </p>
      </div>
      <ProfileForm person={person} />
    </div>
  );
}
