import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  resolution: z.enum(["Upheld", "Rejected"]),
  notes: z.string().min(1, "Resolution notes are required"),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("election_disputes")
    .update({
      status: "Resolved",
      resolution: parsed.data.resolution,
      resolution_notes: parsed.data.notes,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ ok: false, reason: "Could not resolve the dispute." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_resolved_election_dispute",
    target_table: "election_disputes",
    target_id: params.id,
    details: { resolution: parsed.data.resolution, notes: parsed.data.notes },
  });

  return NextResponse.json({ ok: true });
}
