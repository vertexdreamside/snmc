import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Clock } from "lucide-react";

// Honest limitation: the register rebuild deliberately left most expiry
// dates blank rather than guess at ambiguous 2-digit source years, so
// this will show little until those dates are actually filled in.
const WARNING_WINDOW_DAYS = 90;

export default async function LicenseExpiryPage() {
  await requireAdmin(["register"]);
  const supabase = createClient();

  const today = new Date();
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

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Licence Expiry</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">Nurse and Midwife licences already expired or expiring within {WARNING_WINDOW_DAYS} days.</p>
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
              const expired = r[expiryField] < today;
              return (
                <tr key={r.id}>
                  <td className="px-4 py-2">{r.first_name} {r.last_name}</td>
                  <td className="px-4 py-2 text-council-ink/60">{r[regField] || "—"}</td>
                  <td className="px-4 py-2 text-council-ink/60">{r[expiryField]}</td>
                  <td className="px-4 py-2">
                    {expired ? <span className="flex items-center gap-1 text-status-closed text-xs font-medium"><AlertTriangle size={12} aria-hidden="true" /> Expired</span> : <span className="flex items-center gap-1 text-status-pending text-xs font-medium"><Clock size={12} aria-hidden="true" /> Expiring soon</span>}
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
