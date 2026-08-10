import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "Super Admin",
  "Manager",
  "Supervisor",
  "Registration Officer",
  "Election Officer",
  "Minister",
  "Read Only",
] as const;

const updateSchema = z.object({ role: z.enum(ADMIN_ROLES) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["Super Admin"]);
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("admin_users").update({ role: parsed.data.role }).eq("id", params.id);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_changed_admin_role",
    target_table: "admin_users",
    target_id: params.id,
    details: { new_role: parsed.data.role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["Super Admin"]);

  if (params.id === actor.id) {
    return NextResponse.json({ ok: false, reason: "You can't remove your own admin access." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Removal failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_removed_admin_user",
    target_table: "admin_users",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
