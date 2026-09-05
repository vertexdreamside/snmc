// Section 26-27: records Minister Approval — the one action that
// actually allows results to be published. Hard-blocked while any
// dispute for this election is still unresolved, matching Section 27's
// "The results must not be published while the dispute is unresolved"
// — enforced here at the point approval is granted, not left as a UI
// suggestion, since the publish endpoint itself only checks
// approval_status = 'Approved' and has no separate dispute awareness of
// its own.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  approvedBy: z.string().min(1, "Approved By is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { count: unresolvedDisputes } = await supabase
    .from("election_disputes")
    .select("*", { count: "exact", head: true })
    .eq("election_id", params.id)
    .neq("status", "Resolved");

  if ((unresolvedDisputes ?? 0) > 0) {
    await supabase.from("elections").update({ approval_status: "Disputed" }).eq("id", params.id);
    return NextResponse.json({ ok: false, reason: "Cannot approve — this election has one or more unresolved disputes. Resolve them first." }, { status: 400 });
  }

  const { error } = await supabase
    .from("elections")
    .update({
      approval_status: "Approved",
      approved_by: admin.id,
      approved_at: new Date().toISOString(),
      approval_reference: parsed.data.reference || null,
      approval_notes: parsed.data.notes || null,
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ ok: false, reason: "Could not record approval." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_recorded_minister_approval",
    target_table: "elections",
    target_id: params.id,
    details: { approved_by_name: parsed.data.approvedBy, reference: parsed.data.reference, notes: parsed.data.notes },
  });

  return NextResponse.json({ ok: true });
}
