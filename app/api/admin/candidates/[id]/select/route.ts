import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["elections"]);
  const supabase = createServiceRoleClient();

  const { data: candidate } = await supabase.from("candidates").select("id, status").eq("id", params.id).single();
  if (!candidate) return NextResponse.json({ ok: false, reason: "Candidate not found." }, { status: 404 });
  if (candidate.status !== "Nominated") {
    return NextResponse.json({ ok: false, reason: `Already ${candidate.status.toLowerCase()}.` }, { status: 400 });
  }

  await supabase.from("candidates").update({ status: "Pending" }).eq("id", params.id);
  await supabase.from("audit_log").insert({
    actor_id: actor.id, action: "admin_selected_nominee_to_progress",
    target_table: "candidates", target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
