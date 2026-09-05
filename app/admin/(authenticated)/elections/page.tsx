import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CreateElectionForm } from "./CreateElectionForm";
import { computeElectionStageLabel } from "@/lib/elections/tally";

export default async function AdminElectionsPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: elections } = await supabase
    .from("elections")
    .select("id, term_label, status, results_published, approval_status")
    .order("term_label", { ascending: false });

  return (
    <div className="space-y-4 max-w-3xl">
      <CreateElectionForm />
      <div className="bg-white rounded-card border border-council-navy/10 divide-y divide-council-navy/10">
        {elections?.map((e) => (
          <Link key={e.id} href={`/admin/elections/${e.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-council-cream">
            <div>
              <p className="font-body text-sm font-medium text-council-navy">{e.term_label}</p>
              <p className="font-body text-xs text-council-ink/50">{computeElectionStageLabel(e)}</p>
            </div>
            {e.results_published && (
              <span className="text-xs font-body bg-status-active/10 text-status-active px-2 py-0.5 rounded-full">
                Published
              </span>
            )}
          </Link>
        ))}
        {(!elections || elections.length === 0) && (
          <p className="px-5 py-8 text-center font-body text-sm text-council-ink/50">No elections yet.</p>
        )}
      </div>
    </div>
  );
}
