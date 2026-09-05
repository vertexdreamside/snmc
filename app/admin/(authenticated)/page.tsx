import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatusDonut } from "./_components/StatusDonut";
import { SimpleBarChart } from "./_components/SimpleBarChart";
import {
  Users, Heart, ClipboardCheck, AlertTriangle, Vote, ShieldQuestion, UserPlus, FileX, Clock,
  UserPlus2, Search, RefreshCw, FileText, BarChart3, Download, ArrowRight,
} from "lucide-react";
import { canManageRegister, canManageElections, isReportingOnly } from "@/lib/auth/permissions";
import { computeAgeGroup, computeLicenseStatus, AGE_GROUPS } from "@/lib/reports";

const STATUS_LIST = ["Practising", "Not Practising", "Retired", "Abroad", "Deceased", "Deleted", "Unknown"] as const;
const INACTIVE_STATUSES = ["Not Practising", "Retired", "Abroad", "Unknown"];

// "Action centre, not a database screen" — per the confirmed Admin/
// Councillor UX requirements. Three questions the dashboard must answer
// immediately: What is happening? What needs my attention? What do I
// need to do next? Everything above the fold is a task the person can
// act on directly; the detailed charts/breakdowns that a database-minded
// user might want are still here, just moved below, not the first thing
// anyone sees. The underlying data is identical to the previous version
// of this page — this is a presentation change, not a new set of numbers.
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
    { count: pendingRenewals },
    { count: renewalsThisYear },
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
      ? supabase.from("license_renewals").select("*", { count: "exact", head: true }).eq("status", "Pending")
      : Promise.resolve({ count: 0 }),
    showRegister
      ? supabase.from("license_renewals").select("*", { count: "exact", head: true }).eq("status", "Approved").gte("reviewed_at", yearStart)
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
  const activeCount = register.filter((p: any) => p.registration_status === "Practising").length;
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

  const donutData = statusCounts.filter((s: any) => s.value > 0);

  // Attention items, in priority order — this list, and only this list,
  // decides what shows in "What Needs Your Attention?" below. Nothing
  // with a zero count is shown; an empty attention list is itself
  // information ("nothing needs you right now"), not a page with blank
  // cards.
  const attentionItems = [
    showRegister && (pendingReview ?? 0) > 0 && {
      count: pendingReview!, label: "Changes Awaiting Approval", href: "/admin/register/pending",
      color: "text-status-closed", urgent: true,
    },
    showRegister && expiringSoonCount > 0 && {
      count: expiringSoonCount, label: "Licences Expiring Within 90 Days", href: "/admin/register/license-expiry",
      color: "text-status-pending", urgent: false,
    },
    showRegister && (pendingRenewals ?? 0) > 0 && {
      count: pendingRenewals!, label: "Licence Renewals Awaiting Review", href: "/admin/register/renewals",
      color: "text-status-pending", urgent: false,
    },
    showElections && (pendingCandidateDecisions ?? 0) > 0 && {
      count: pendingCandidateDecisions!, label: "Election Tasks Awaiting Action", href: "/admin/elections",
      color: "text-council-cyan", urgent: false,
    },
    showRegister && (unconfirmedCategory ?? 0) > 0 && {
      count: unconfirmedCategory!, label: "Records Need Category Confirmed", href: "/admin/register/classify",
      color: "text-council-cyan", urgent: false,
    },
  ].filter(Boolean) as { count: number; label: string; href: string; color: string; urgent: boolean }[];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="font-display text-xl text-council-navy">Good morning, {admin.full_name?.split(" ")[0] ?? "there"}</h2>
        <p className="font-body text-sm text-council-ink/50">Here's what needs your attention today.</p>
      </div>

      {(showRegister || showElections) && (
        <>
          {attentionItems.length > 0 ? (
            <div>
              <h3 className="font-display text-base text-council-navy mb-3">What Needs Your Attention?</h3>
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between bg-white rounded-card border p-4 hover:bg-council-cream transition-colors ${item.urgent ? "border-status-closed/30" : "border-council-navy/10"}`}
                  >
                    <p className="font-body text-sm text-council-navy">
                      <span className={`font-display text-lg font-medium ${item.color} mr-2`}>{item.count}</span>
                      {item.label}
                    </p>
                    <span className="flex items-center gap-1 font-body text-xs text-council-cyan font-medium">
                      Review Now <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-status-active/5 border border-status-active/20 rounded-card p-4">
              <p className="font-body text-sm text-council-navy">Nothing needs your attention right now — everything is up to date.</p>
            </div>
          )}

          <div>
            <h3 className="font-display text-base text-council-navy mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {showRegister && <QuickAction icon={UserPlus2} label="Add Nurse / Midwife" href="/admin/register/new" />}
              {showRegister && <QuickAction icon={Search} label="Find Nurse / Midwife" href="/admin/register" />}
              {showRegister && <QuickAction icon={ClipboardCheck} label="Review Approvals" href="/admin/register/pending" />}
              {showRegister && <QuickAction icon={RefreshCw} label="Licence Renewals" href="/admin/register/renewals" />}
              {showRegister && <QuickAction icon={AlertTriangle} label="Licence Expiry" href="/admin/register/license-expiry" />}
              {showElections && <QuickAction icon={Vote} label="Elections" href="/admin/elections" />}
              {(showRegister || showElections) && <QuickAction icon={BarChart3} label="Reports" href="/admin/reports" />}
              {showRegister && <QuickAction icon={Download} label="Export Data" href="/admin/data-export" />}
            </div>
          </div>
        </>
      )}

      {(showRegister || showElections) && (
        <div>
          <h3 className="font-display text-base text-council-navy mb-3">Key Statistics</h3>
          <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
            <table className="w-full font-body text-sm">
              <tbody className="divide-y divide-council-navy/10">
                {showRegister && (
                  <>
                    <StatRow icon={Users} label="Total Nurses" value={nurseCount} href="/admin/register" />
                    <StatRow icon={Heart} label="Total Midwives" value={midwifeCount} href="/admin/register" />
                    <StatRow icon={UserPlus} label="New Registrations This Year" value={newThisYear ?? 0} href="/admin/register" />
                    <StatRow icon={Users} label="Active Professionals" value={activeCount} href="/admin/register" />
                    <StatRow icon={AlertTriangle} label="Inactive Nurses" value={inactiveNurseCount} href="/admin/register" />
                    <StatRow icon={AlertTriangle} label="Inactive Midwives" value={inactiveMidwifeCount} href="/admin/register" />
                    <StatRow icon={Clock} label="Licences Expiring Soon" value={expiringSoonCount} href="/admin/register/license-expiry" />
                    <StatRow icon={FileX} label="Expired Licences" value={expiredLicenceCount} href="/admin/register/license-expiry" />
                    <StatRow icon={ClipboardCheck} label="Pending Approvals" value={pendingReview ?? 0} href="/admin/register/pending" />
                    <StatRow icon={RefreshCw} label="Pending Renewals" value={pendingRenewals ?? 0} href="/admin/register/renewals" />
                    <StatRow icon={UserPlus} label="Renewals This Year" value={renewalsThisYear ?? 0} href="/admin/register/renewals" />
                    <StatRow icon={ShieldQuestion} label="Category Not Confirmed" value={unconfirmedCategory ?? 0} href="/admin/register/classify" />
                  </>
                )}
                {showElections && <StatRow icon={Vote} label="Elections Currently Open" value={openElections ?? 0} href="/admin/elections" />}
                {showElections && <StatRow icon={Vote} label="Pending Election Actions" value={pendingCandidateDecisions ?? 0} href="/admin/elections" />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRegister && (
        <details className="group">
          <summary className="font-display text-base text-council-navy mb-3 cursor-pointer list-none flex items-center gap-2">
            <FileText size={16} className="text-council-ink/40" aria-hidden="true" />
            More Detail (Charts & Breakdowns)
          </summary>
          <div className="grid gap-4 sm:grid-cols-2 mt-3">
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
        </details>
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

function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <a href={href} className="flex flex-col items-center justify-center gap-2 bg-white rounded-card border border-council-navy/10 p-5 hover:bg-council-cream hover:border-council-cyan transition-colors text-center">
      <Icon size={24} strokeWidth={1.75} className="text-council-cyan" aria-hidden="true" />
      <span className="font-body text-xs font-medium text-council-navy">{label}</span>
    </a>
  );
}

function StatRow({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: number; href: string }) {
  return (
    <tr>
      <td className="px-4 py-3 w-8">
        <Icon size={16} className="text-council-ink/40" aria-hidden="true" />
      </td>
      <td className="px-4 py-3 text-council-ink/70">{label}</td>
      <td className="px-4 py-3 text-right">
        <a href={href} className="font-display text-base font-medium text-council-navy hover:text-council-cyan hover:underline">
          {value.toLocaleString()}
        </a>
      </td>
    </tr>
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
