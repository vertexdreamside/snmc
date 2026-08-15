import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const STATUS_OPTIONS = ["Practising", "Not Practising", "Retired", "Abroad", "Deceased", "Deleted", "Unknown"];
const PROFILE_STATUS_OPTIONS = ["Approved", "Pending Review", "Rejected"];

export default async function AdminRegisterPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; profile_status?: string };
}) {
  await requireAdmin();
  const supabase = createClient();

  let query = supabase
    .from("people")
    .select("id, first_name, last_name, nurse_reg_no, midwife_reg_no, professional_category, registration_status, profile_status")
    .order("last_name")
    .limit(100);

  if (searchParams.q) {
    query = query.or(`first_name.ilike.%${searchParams.q}%,last_name.ilike.%${searchParams.q}%,nurse_reg_no.ilike.%${searchParams.q}%,midwife_reg_no.ilike.%${searchParams.q}%`);
  }
  if (searchParams.status) {
    query = query.eq("registration_status", searchParams.status);
  }
  if (searchParams.profile_status) {
    query = query.eq("profile_status", searchParams.profile_status);
  }

  const { data: people } = await query;

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-3 bg-white rounded-card border border-council-navy/10 p-4">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name or registration number…"
          className="flex-1 min-w-[200px] border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="profile_status"
          defaultValue={searchParams.profile_status ?? ""}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm"
        >
          <option value="">Any profile status</option>
          {PROFILE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep"
        >
          Filter
        </button>
      </form>

      <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-council-cream text-council-ink/60 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Reg. No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-council-navy/10">
            {people?.map((p) => (
              <tr key={p.id} className="hover:bg-council-cream">
                <td className="px-4 py-3">
                  <Link href={`/admin/register/${p.id}`} className="text-council-navy underline">
                    {p.first_name} {p.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-council-ink/70">{p.nurse_reg_no || p.midwife_reg_no || "—"}</td>
                <td className="px-4 py-3 text-council-ink/70">{p.professional_category ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill status={p.registration_status} />
                </td>
                <td className="px-4 py-3 text-council-ink/70">{p.profile_status}</td>
              </tr>
            ))}
            {(!people || people.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-council-ink/50">
                  No matching records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="font-body text-xs text-council-ink/40">Showing up to 100 results — narrow your search for more precise results.</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "Practising"
      ? "bg-status-active/10 text-status-active"
      : status === "Unknown"
        ? "bg-status-closed/10 text-status-closed"
        : "bg-council-navy/10 text-council-ink/70";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{status}</span>;
}
