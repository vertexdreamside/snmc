import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

// Section 4 of the platform requirements: identifies licences already
// expired or expiring within 7/30/60/90 days, with clear status
// indicators per name. Honest limitation, unchanged from before: the
// register rebuild deliberately left most expiry dates blank rather than
// guess at ambiguous 2-digit source years, so this will show little
// until those dates are actually filled in.
//
// "Where email/notification functionality exists, provide reminders" —
// there currently isn't one. Nurses/midwives log in via a placeholder
// magic-link address, not a real inbox (same constraint noted for
// nominee notifications), so an actual email reminder can't be sent
// without first collecting real contact details. What DOES exist: an
// in-app reminder on the person's own profile page (see
// app/portal/(authenticated)/profile/page.tsx) showing their own
// upcoming expiry the moment they log in — the same in-app pattern used
// for nominee Accept/Decline, for the same underlying reason.
const WARNING_WINDOW_DAYS = 90;

type ExpiryStatus = "Expired" | "Expires in 7 days" | "Expires in 30 days" | "Expires in 60 days" | "Expires in 90 days" | "Valid";

function computeStatus(expiryDate: string, todayStr: string): ExpiryStatus {
  const days = Math.floor((new Date(expiryDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days <= 7) return "Expires in 7 days";
  if (days <= 30) return "Expires in 30 days";
  if (days <= 60) return "Expires in 60 days";
  return "Expires in 90 days";
}

const STATUS_STYLE: Record<ExpiryStatus, { icon: typeof AlertTriangle; className: string }> = {
  Expired: { icon: AlertTriangle, className: "text-status-closed" },
  "Expires in 7 days": { icon: AlertTriangle, className: "text-status-closed" },
  "Expires in 30 days": { icon: Clock, className: "text-status-pending" },
  "Expires in 60 days": { icon: Clock, className: "text-status-pending" },
  "Expires in 90 days": { icon: Clock, className: "text-council-cyan" },
  Valid: { icon: CheckCircle2, className: "text-status-active" },
};

export default async function LicenseExpiryPage() {
  await requireAdmin(["register"]);
  const supabase = createClient();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const warningDate = new Date(today.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { data: nurseExpiring } = await supabase
    .from("people").select("id, first_name, last_name, nurse_reg_no, nurse_license_expiry")
    .not("nurse_license_expiry", "is", null)
    .lte("nurse_license_expiry", warningDate.toISOString().slice(0, 10))
    .order("nurse_license_expiry");

  const { data: midwifeExpiring } = await supabase
    .from("people").select("id, first_name, last_name, midwife_reg_no, midwife_license_expiry")
    .not("midwife_license_expiry", "is", null)
    .lte("midwife_license_expiry", warningDate.toISOString().slice(0, 10))
    .order("midwife_license_expiry");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Licence Expiry</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Nurse and Midwife licences already expired or expiring within {WARNING_WINDOW_DAYS} days, broken down by
          how urgent each one is.
        </p>
      </div>
      <ExpiryTable title="Nurse Licences" rows={nurseExpiring ?? []} regField="nurse_reg_no" expiryField="nurse_license_expiry" today={todayStr} />
      <ExpiryTable title="Midwife Licences" rows={midwifeExpiring ?? []} regField="midwife_reg_no" expiryField="midwife_license_expiry" today={todayStr} />
    </div>
  );
}

function ExpiryTable({ title, rows, regField, expiryField, today }: { title: string; rows: any[]; regField: string; expiryField: string; today: string }) {
  return (
    <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
      <div className="p-4 border-b border-council-navy/10"><h2 className="font-display text-sm text-council-navy">{title}</h2></div>
      {rows.length === 0 ? (
        <p className="font-body text-sm text-council-ink/40 p-6 text-center">None expiring soon — or no expiry dates are on file yet for anyone in this category.</p>
      ) : (
        <table className="w-full font-body text-sm">
          <thead className="bg-council-cream text-council-ink/60 text-left"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Reg. No.</th><th className="px-4 py-2">Expiry</th><th className="px-4 py-2">Status</th></tr></thead>
          <tbody className="divide-y divide-council-navy/10">
            {rows.map((r) => {
              const status = computeStatus(r[expiryField], today);
              const { icon: Icon, className } = STATUS_STYLE[status];
              return (
                <tr key={r.id}>
                  <td className="px-4 py-2">{r.first_name} {r.last_name}</td>
                  <td className="px-4 py-2 text-council-ink/60">{r[regField] || "—"}</td>
                  <td className="px-4 py-2 text-council-ink/60">{r[expiryField]}</td>
                  <td className="px-4 py-2">
                    <span className={`flex items-center gap-1 text-xs font-medium ${className}`}>
                      <Icon size={12} aria-hidden="true" /> {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
