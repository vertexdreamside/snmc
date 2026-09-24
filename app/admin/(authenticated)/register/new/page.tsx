import { requireAdmin } from "@/lib/auth/guards";
import { NewPersonForm } from "./NewPersonForm";

export default async function NewPersonPage() {
  await requireAdmin(["register"]);
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-xl text-council-navy mb-1">Add Nurse / Midwife</h1>
      <p className="font-body text-sm text-council-ink/60 mb-6">
        Adds a new record directly to the register. This starts as Approved — an admin entering this has already reviewed it.
      </p>
      <NewPersonForm />
    </div>
  );
}
