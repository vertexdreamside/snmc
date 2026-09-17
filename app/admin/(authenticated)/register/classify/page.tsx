import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ClassifyTable } from "./ClassifyTable";

export default async function ClassifyPage({ searchParams }: { searchParams: { q?: string; docStatus?: string } }) {
  await requireAdmin();
  const supabase = createClient();

  let query = supabase
    .from("people")
    .select("id, first_name, last_name, nurse_reg_no, midwife_reg_no, professional_category")
    .eq("category_confirmed", false)
    .order("last_name")
    .limit(500);

  if (searchParams.q) {
    const q = searchParams.q;
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,nurse_reg_no.ilike.%${q}%,midwife_reg_no.ilike.%${q}%`);
  }

  const { data: rawPeople } = await query;
  const { count: totalUnconfirmed } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true })
    .eq("category_confirmed", false);

  // License document status per person, both types — folds document
  // verification into the same page as category confirmation, since both
  // are really the same underlying question: is this person's
  // professional standing actually verified.
  const personIds = (rawPeople ?? []).map((p) => p.id);
  const { data: documents } = personIds.length
    ? await supabase.from("license_documents").select("id, person_id, license_type, status, original_filename").in("person_id", personIds)
    : { data: [] };
  const docsByPerson = new Map<string, { nurse?: any; midwife?: any }>();
  for (const doc of documents ?? []) {
    const entry = docsByPerson.get(doc.person_id) ?? {};
    if (doc.license_type === "Nurse") entry.nurse = doc;
    else entry.midwife = doc;
    docsByPerson.set(doc.person_id, entry);
  }

  // License status filter — applied after the document lookup above,
  // since "has an approved/pending/rejected document" isn't a column on
  // people itself, it's derived from license_documents.
  const docStatus = searchParams.docStatus;
  const people = docStatus
    ? (rawPeople ?? []).filter((p) => {
        const docs = docsByPerson.get(p.id);
        const statuses = [docs?.nurse?.status, docs?.midwife?.status].filter(Boolean);
        if (docStatus === "None") return statuses.length === 0;
        return statuses.includes(docStatus);
      })
    : rawPeople ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl text-council-navy">License Approval</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {totalUnconfirmed ?? 0} record(s) still need a confirmed category, and license documents can be
          uploaded and reviewed below. Nobody can nominate or vote in a category until it's confirmed here.
        </p>
      </div>

      <form className="bg-white rounded-card border border-council-navy/10 p-4 flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by name or registration number…"
          className="flex-1 min-w-[220px] border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <select name="docStatus" defaultValue={searchParams.docStatus ?? ""} className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm">
          <option value="">Any document status</option>
          <option value="Pending">Pending review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="None">No document uploaded</option>
        </select>
        <button type="submit" className="text-sm font-body bg-council-navy text-white rounded-card px-4 py-2">Search</button>
      </form>

      <ClassifyTable people={people} documents={docsByPerson} />
      <p className="font-body text-xs text-council-ink/40">
        Showing up to 500 at a time (matching the bulk-confirm limit) — confirmed records drop off this list
        automatically, so repeat as needed until the count above reaches 0.
      </p>
    </div>
  );
}
