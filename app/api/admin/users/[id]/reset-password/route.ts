// Resets an admin/councillor's password DIRECTLY — no email involved at
// all, per explicit direction: "Do NOT send the reset password through
// email." Generates a secure temporary password server-side and sets it
// immediately via Supabase's admin API, which requires no email step
// and therefore has no email rate limit to hit either. The generated
// password is returned once, in this response only, for the requesting
// admin to relay to the account holder directly (in person, a message,
// whatever the Council actually uses) — never logged anywhere, per
// "Do not log the actual password."

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

function generateTempPassword(): string {
  // 12 random bytes, base64url-encoded, trimmed to a clean 16-character
  // password — no email is ever sent, so there's no requirement to keep
  // this "typeable"; a real high-entropy value is safer than a
  // human-friendly one here.
  return randomBytes(12).toString("base64url").slice(0, 16);
}

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
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

  const tempPassword = generateTempPassword();
  const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.auth_user_id, { password: tempPassword });
  if (updateError) {
    return NextResponse.json({ ok: false, reason: updateError.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_reset_password",
    target_table: "admin_users",
    target_id: params.id,
    // Deliberately no password value anywhere in these details.
  });

  return NextResponse.json({ ok: true, tempPassword });
}
