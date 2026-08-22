import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatusDonut } from "./_components/StatusDonut";
import { Users, Heart, ClipboardCheck, AlertTriangle, Vote, FileWarning, ShieldQuestion } from "lucide-react";
import { canManageRegister, canManageElections, isReportingOnly } from "@/lib/auth/permissions";

const STATUS_LIST = ["Practising", "Not Practising", "Retired", "Abroad", "Deceased", "Deleted", "Unknown"] as const;

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const supabase = createClient();

  // What this admin sees is scoped to what they can actually do — see
  // lib/auth/permissions.ts for the mapping. A Registration Officer
  // doesn't get an Elections tile; an Election Officer doesn't get
  // register detail; Minister/Read Only see everything, read-only.
  const showRegister = canManageRegister(admin) || isReportingOnly(admin);
  const showElections = canManageElections(admin) || isReportingOnly(admin);

  const [{ count: totalPeople }, { count: pendingReview }, { count: openElections }, { count: unconfirmedCategory }, statusCounts] =
    await Promise.all([
      showRegister ? supabase.from("people").select("*", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
      showRegister
        ? supabase.from("people").select("*", { count: "exact", head: true }).eq("profile_status", "Pending Review")
        : Promise.resolve({ count: 0 }),
      showElections
        ? supabase.from("elections").select("*", { count: "exact", head: true }).in("status", ["Nomination Open", "Election Open"])
        : Promise.resolve({ count: 0 }),
      showRegister
        ? supabase.from("people").select("*", { count: "exact", head: true }).eq("category_confirmed", false)
        : Promise.resolve({ count: 0 }),
      showRegister
        ? Promise.all(
            STATUS_LIST.map((status) =>
              supabase
                .from("people")
                .select("*", { count: "exact", head: true })
                .eq("registration_status", status)
                .then((r) => ({ name: status, value: r.count ?? 0 }))
            )
          )
        : Promise.resolve([]),
    ]);

  const nurseCount = statusCounts.find((s) => s.name === "Practising")?.value ?? 0;
  const unknownCount = statusCounts.find((s) => s.name === "Unknown")?.value ?? 0;
  const donutData = statusCounts.filter((s) => s.value > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-council-navy">Welcome back, {admin.full_name?.split(" ")[0] ?? "there"}</h2>
          <p className="font-body text-sm text-council-ink/50">
            {admin.role ? `${admin.role} · ` : ""}Here's what's relevant to you today.
          </p>
        </div>
      </div>

      {showRegister && (unconfirmedCategory ?? 0) > 0 && canManageRegister(admin) && (
        <a
          href="/admin/register/classify"
          className="block bg-white rounded-card border-2 border-council-cyan p-4 hover:bg-council-cream transition-colors"
        >
          <p className="font-body text-sm text-council-navy">
            <span className="font-medium">{unconfirmedCategory} record(s)</span> still need their Nurse/Midwife
            category confirmed before those people can nominate or vote.{" "}
            <span className="underline">Confirm now →</span>
          </p>
        </a>
      )}

      {(showRegister || showElections) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {showRegister && (
            <>
              <StatCard icon={Users} value={totalPeople ?? 0} label="Total Registered" />
              <StatCard icon={Heart} value={nurseCount} label="Currently Practising" />
              <StatCard icon={ClipboardCheck} value={pendingReview ?? 0} label="Pending Approval" />
              <StatCard icon={ShieldQuestion} value={unconfirmedCategory ?? 0} label="Category Not Confirmed" />
              <StatCard icon={AlertTriangle} value={unknownCount} label="Unknown Status — Needs Review" />
              <StatCard
                icon={FileWarning}
                value={statusCounts.find((s) => s.name === "Deceased")?.value ?? 0}
                label="Deceased — Admin Records"
              />
            </>
          )}
          {showElections && <StatCard icon={Vote} value={openElections ?? 0} label="Elections Currently Open" />}
        </div>
      )}

      {showRegister && (
        <div className="bg-white rounded-card border border-council-navy/10 p-6">
          <h3 className="font-display text-base text-council-navy mb-1">Register status breakdown</h3>
          <p className="font-body text-xs text-council-ink/50 mb-2">Live counts from the current register.</p>
          {donutData.length > 0 ? (
            <StatusDonut data={donutData} />
          ) : (
            <p className="font-body text-sm text-council-ink/50 py-8 text-center">
              No data yet — run the migration and import script to populate the register.
            </p>
          )}
        </div>
      )}

      {!showRegister && !showElections && (
        <div className="bg-white rounded-card border border-council-navy/10 p-6">
          <p className="font-body text-sm text-council-ink/50">
            You don't have any dashboard sections enabled yet — ask a Super Admin to grant you access under
            Admin Users, or visit Reports if you have that permission.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-5">
      <div className="w-11 h-11 rounded-full border-2 border-council-cyan flex items-center justify-center mb-4">
        <Icon size={20} strokeWidth={1.75} className="text-council-cyan" aria-hidden="true" />
      </div>
      <p className="font-display text-2xl text-council-navy">{value.toLocaleString()}</p>
      <p className="font-body text-xs text-council-ink/50 mt-1">{label}</p>
    </div>
  );
}
