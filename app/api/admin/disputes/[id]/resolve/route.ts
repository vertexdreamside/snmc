import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  resolution: z.enum(["Upheld", "Rejected"]),
  notes: z.string().min(1, "Resolution notes are required"),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: dispute, error } = await supabase
    .from("election_disputes")
    .update({
      status: "Resolved",
      resolution: parsed.data.resolution,
      resolution_notes: parsed.data.notes,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("election_id")
    .single();

  if (error || !dispute) return NextResponse.json({ ok: false, reason: "Could not resolve the dispute." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_resolved_election_dispute",
    target_table: "election_disputes",
    target_id: params.id,
    details: { resolution: parsed.data.resolution, notes: parsed.data.notes },
  });

  // INC-019: approve/route.ts sets approval_status to "Disputed" when it
  // blocks an approval attempt over an unresolved dispute, but nothing
  // ever reset it back — so the "unresolved dispute" warning banner could
  // keep showing even after every dispute against this election had been
  // resolved (confirmed live: the actual approve button was never
  // affected, since that endpoint re-derives the real unresolved count
  // itself rather than trusting this field — this was a display bug
  // only). If this was the last unresolved dispute for this election and
  // its approval_status is still sitting at "Disputed" from an earlier
  // blocked attempt, clear it back to "Pending Approval" so the banner
  // reflects reality again.
  const { count: stillUnresolved } = await supabase
    .from("election_disputes")
    .select("*", { count: "exact", head: true })
    .eq("election_id", dispute.election_id)
    .neq("status", "Resolved");

  if ((stillUnresolved ?? 0) === 0) {
    await supabase
      .from("elections")
      .update({ approval_status: "Pending Approval" })
      .eq("id", dispute.election_id)
      .eq("approval_status", "Disputed");
  }

  return NextResponse.json({ ok: true });
}
