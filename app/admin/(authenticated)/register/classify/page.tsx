import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ClassifyTable } from "./ClassifyTable";

export default async function ClassifyPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdmin();
  const supabase = createClient();

  let query = supabase
    .from("people")
    .select("id, first_name, last_name, nurse_reg_no, midwife_reg_no, professional_category")
    .eq("category_confirmed", false)
    .order("last_name")
    .limit(500);

  if (searchParams.q) {
    query = query.or(`first_name.ilike.%${searchParams.q}%,last_name.ilike.%${searchParams.q}%`);
  }

  const { data: people } = await query;
  const { count: totalUnconfirmed } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true })
    .eq("category_confirmed", false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl text-council-navy">Confirm Nurse / Midwife categories</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {totalUnconfirmed ?? 0} record(s) still need a confirmed category. Nobody can nominate or vote in a
          category until it's confirmed here.
        </p>
      </div>

      <form className="bg-white rounded-card border border-council-navy/10 p-4">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by name…"
          className="w-full max-w-sm border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
      </form>

      <ClassifyTable people={people ?? []} />
      <p className="font-body text-xs text-council-ink/40">
        Showing up to 500 at a time (matching the bulk-confirm limit) — confirmed records drop off this list
        automatically, so repeat as needed until the count above reaches 0.
      </p>
    </div>
  );
}
