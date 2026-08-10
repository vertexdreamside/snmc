import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = createClient();

  const [{ count: totalPeople }, { count: pendingReview }, { count: unknownStatus }] = await Promise.all([
    supabase.from("people").select("*", { count: "exact", head: true }),
    supabase.from("people").select("*", { count: "exact", head: true }).eq("profile_status", "Pending Review"),
    supabase.from("people").select("*", { count: "exact", head: true }).eq("registration_status", "Unknown"),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-3 max-w-4xl">
      <StatCard label="Total Registered" value={totalPeople ?? 0} />
      <StatCard label="Pending Approval" value={pendingReview ?? 0} accent="pending" />
      <StatCard label="Unknown Status — Needs Review" value={unknownStatus ?? 0} accent="closed" />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "pending" | "closed";
}) {
  const accentClass = accent ? `text-status-${accent}` : "text-council-navy";
  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <p className="font-body text-sm text-council-ink/60 mb-1">{label}</p>
      <p className={`font-display text-3xl ${accentClass}`}>{value}</p>
    </div>
  );
}
