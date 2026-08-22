import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ELECTION_STATUSES = [
  "Planned",
  "Nomination Open",
  "Nomination Closed",
  "Election Open",
  "Election Closed",
  "Completed",
] as const;

const updateSchema = z.object({
  status: z.enum(ELECTION_STATUSES).optional(),
  resultsPublished: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const update: Record<string, unknown> = {};
  if (parsed.data.status) update.status = parsed.data.status;
  if (parsed.data.resultsPublished !== undefined) update.results_published = parsed.data.resultsPublished;

  const { error } = await supabase.from("elections").update(update).eq("id", params.id);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_updated_election",
    target_table: "elections",
    target_id: params.id,
    details: update,
  });

  return NextResponse.json({ ok: true });
}
