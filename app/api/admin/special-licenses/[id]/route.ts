import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["register"]);
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("special_licenses").delete().eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, reason: "Could not remove the licence." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_removed_special_license",
    target_table: "special_licenses",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
