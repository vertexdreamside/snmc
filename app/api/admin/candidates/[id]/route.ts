import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  status: z.enum(["Nominated", "Shortlisted", "Elected", "Not Elected"]),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["Election Officer", "Manager", "Super Admin"]);
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("candidates").update({ status: parsed.data.status }).eq("id", params.id);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_updated_candidate_status",
    target_table: "candidates",
    target_id: params.id,
    details: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
