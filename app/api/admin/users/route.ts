// Triggers Supabase's built-in password-reset email for an admin user.
// The admin who clicks this never sees or sets the password themselves —
// only the recipient does, via the emailed link. Super Admin only, same
// as the rest of user management.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["users"]);
  const supabase = createServiceRoleClient();

  const { data: adminUser, error: lookupError } = await supabase
    .from("admin_users")
    .select("auth_user_id, full_name")
    .eq("id", params.id)
    .single();

  if (lookupError || !adminUser) {
    return NextResponse.json({ ok: false, reason: "Admin user not found." }, { status: 404 });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(adminUser.auth_user_id);
  if (authError || !authUser?.user?.email) {
    return NextResponse.json({ ok: false, reason: "Could not find that user's email address." }, { status: 500 });
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(authUser.user.email);
  if (resetError) {
    return NextResponse.json({ ok: false, reason: resetError.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_sent_password_reset",
    target_table: "admin_users",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true, email: authUser.user.email });
}
