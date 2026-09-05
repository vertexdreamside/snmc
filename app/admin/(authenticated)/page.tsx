import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatusDonut } from "./_components/StatusDonut";
import { SimpleBarChart } from "./_components/SimpleBarChart";
import { Users, Heart, ClipboardCheck, AlertTriangle, Vote, FileWarning, ShieldQuestion, UserPlus, FileX, Clock } from "lucide-react";
import { canManageRegister, canManageElections, isReportingOnly } from "@/lib/auth/permissions";
import { computeAgeGroup, computeLicenseStatus, AGE_GROUPS } from "@/lib/reports";

const STATUS_LIST = ["Practising", "Not Practising", "Retired", "Abroad", "Deceased", "Deleted", "Unknown"] as const;
const INACTIVE_STATUSES = ["Not Practising", "Retired", "Abroad", "Unknown"];

// Council Management Dashboard (per the confirmed platform requirements
// document) — real statistics computed from the live register, not a
// raw table view. Two things are deliberately NOT shown here, flagged
// rather than faked: "Suspended" isn't a status this register actually
// tracks (registration_status has no Suspended value — Practising, Not
// Practising, Retired, Abroad, Deceased, Deleted, Unknown are the only
// real values), and "Pending Licence Renewals" / "Renewals This Year"
// aren't tracked yet because there's no renewal-application workflow
// built (licence documents can be uploaded/approved, but a distinct
// "renewal application" entity with its own history doesn't exist yet).
export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const showRegister = canManageRegister(admin) || isReportingOnly(admin);
  const showElections = canManageElections(admin) || isReportingOnly(admin);

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const [
    { count: totalPeople },
    { count: pendingReview },
    { count: openElections },
    { count: unconfirmedCategory },
    { count: newThisYear },
    { count: pendingCandidateDecisions },
    statusCounts,
    fullRegisterForBreakdowns,
  ] = await Promise.all([
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
      ? supabase.from("people").select("*", { count: "exact", head: true }).gte("created_at", yearStart)
      : Promise.resolve({ count: 0 }),
    showElections
      ? supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "Pending")
      : Promise.resolve({ count: 0 }),
    showRegister
      ? Promise.all(
          STATUS_LIST.map((status) =>
            supabase.from("people").select("*", { count: "exact", head: true }).eq("registration_status", status).then((r) => ({ name: status, value: r.count ?? 0 }))
          )
        )
      : Promise.resolve([]),
    showRegister
      ? supabase.from("people").select("professional_category, registration_status, sex, date_of_birth, nurse_license_expiry, midwife_license_expiry")
      : Promise.resolve({ data: [] }),
  ]);

  const register = (fullRegisterForBreakdowns as any).data ?? [];

  const nurseCount = register.filter((p: any) => p.professional_category === "Nurse" || p.professional_category === "Both").length;
  const midwifeCount = register.filter((p: any) => p.professional_category === "Midwife" || p.professional_category === "Both").length;
  const activeNurseCount = register.filter((p: any) => (p.professional_category === "Nurse" || p.professional_category === "Both") && p.registration_status === "Practising").length;
  const activeMidwifeCount = register.filter((p: any) => (p.professional_category === "Midwife" || p.professional_category === "Both") && p.registration_status === "Practising").length;
  const inactiveNurseCount = register.filter((p: any) => (p.professional_category === "Nurse" || p.professional_category === "Both") && INACTIVE_STATUSES.includes(p.registration_status)).length;
  const inactiveMidwifeCount = register.filter((p: any) => (p.professional_category === "Midwife" || p.professional_category === "Both") && INACTIVE_STATUSES.includes(p.registration_status)).length;

  const expiredLicenceCount = register.filter((p: any) => computeLicenseStatus(p.nurse_license_expiry, p.midwife_license_expiry) === "Expired").length;
  const expiringSoonCount = register.filter((p: any) => computeLicenseStatus(p.nurse_license_expiry, p.midwife_license_expiry) === "Expiring Soon").length;

  const ageData = AGE_GROUPS.map((group) => ({
    name: group,
    value: register.filter((p: any) => computeAgeGroup(p.date_of_birth) === group).length,
  })).filter((g) => g.value > 0);

  const genderData = [
    { name: "Female", value: register.filter((p: any) => p.sex === "F").length },
    { name: "Male", value: register.filter((p: any) => p.sex === "M").length },
    { name: "Unknown", value: register.filter((p: any) => p.sex === "Unknown" || !p.sex).length },
  ].filter((g) => g.value > 0);

  const professionData = [
    { name: "Nurses", value: nurseCount },
    { name: "Midwives", value: midwifeCount },
  ];

  const unknownCount = statusCounts.find((s: any) => s.name === "Unknown")?.value ?? 0;
  const donutData = statusCounts.filter((s: any) => s.value > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-display text-xl text-council-navy">Welcome back, {admin.full_name?.split(" ")[0] ?? "there"}</h2>
        <p className="font-body text-sm text-council-ink/50">
          {admin.role ? `${admin.role} · ` : ""}Here's the Council's current register at a glance.
        </p>
      </div>

      {showRegister && (unconfirmedCategory ?? 0) > 0 && canManageRegister(admin) && (
        <a href="/admin/register/classify" className="block bg-white rounded-card border-2 border-council-cyan p-4 hover:bg-council-cream transition-colors">
          <p className="font-body text-sm text-council-navy">
            <span className="font-medium">{unconfirmedCategory} record(s)</span> still need their Nurse/Midwife
            category confirmed before those people can nominate or vote. <span className="underline">Confirm now →</span>
          </p>
        </a>
      )}

      {(showRegister || showElections) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {showRegister && (
            <>
              <StatCard icon={Users} value={totalPeople ?? 0} label="Total Registered Professionals" />
              <StatCard icon={Heart} value={nurseCount} label="Total Registered Nurses" />
              <StatCard icon={Heart} value={midwifeCount} label="Total Registered Midwives" />
              <StatCard icon={UserPlus} value={newThisYear ?? 0} label="New Registrations This Year" />
              <StatCard icon={Users} value={activeNurseCount} label="Active Nurses" />
              <StatCard icon={Users} value={activeMidwifeCount} label="Active Midwives" />
              <StatCard icon={AlertTriangle} value={inactiveNurseCount} label="Inactive Nurses" />
              <StatCard icon={AlertTriangle} value={inactiveMidwifeCount} label="Inactive Midwives" />
              <StatCard icon={FileX} value={expiredLicenceCount} label="Expired Licences" />
              <StatCard icon={Clock} value={expiringSoonCount} label="Licences Expiring Soon" />
              <StatCard icon={ClipboardCheck} value={pendingReview ?? 0} label="Pending Approvals" />
              <StatCard icon={ShieldQuestion} value={unconfirmedCategory ?? 0} label="Category Not Confirmed" />
            </>
          )}
          {showElections && <StatCard icon={Vote} value={openElections ?? 0} label="Elections Currently Open" />}
          {showElections && <StatCard icon={Vote} value={pendingCandidateDecisions ?? 0} label="Pending Election Actions" />}
        </div>
      )}

      {showRegister && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ChartCard title="Nurses vs Midwives">
            <SimpleBarChart data={professionData} />
          </ChartCard>
          <ChartCard title="Register Status Breakdown">
            {donutData.length > 0 ? <StatusDonut data={donutData} /> : <EmptyChart />}
          </ChartCard>
          <ChartCard title="Age Distribution">
            {ageData.length > 0 ? <SimpleBarChart data={ageData} color="#1B2074" /> : <EmptyChart />}
          </ChartCard>
          <ChartCard title="Gender Distribution">
            {genderData.length > 0 ? <SimpleBarChart data={genderData} color="#5CC8ED" /> : <EmptyChart />}
          </ChartCard>
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

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <h3 className="font-display text-base text-council-navy mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <p className="font-body text-sm text-council-ink/50 py-8 text-center">No data yet.</p>;
}
