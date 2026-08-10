// Adding a new staff/Council-level admin user. Sends a real Supabase Auth
// invite email (magic-link based account setup) rather than handling a
// password directly — Super Admin only, since this is account/privilege
// creation.

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

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(ADMIN_ROLES),
});

export async function POST(request: Request) {
  const actor = await requireAdmin(["Super Admin"]);

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(parsed.data.email);
  if (inviteError || !invited?.user) {
    return NextResponse.json(
      { ok: false, reason: inviteError?.message ?? "Could not send invitation." },
      { status: 500 }
    );
  }

  const { error: insertError } = await supabase.from("admin_users").insert({
    auth_user_id: invited.user.id,
    role: parsed.data.role,
    full_name: parsed.data.fullName,
  });

  if (insertError) {
    return NextResponse.json({ ok: false, reason: "Invitation sent, but could not save the admin record." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_invited_new_admin",
    target_table: "admin_users",
    details: { email: parsed.data.email, role: parsed.data.role },
  });

  return NextResponse.json({ ok: true });
}
