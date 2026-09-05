// Creates a new Admin User or Councillor account via Supabase's secure
// invite-link mechanism — the person who creates this account never
// sees or sets a password; only the recipient does, via the emailed
// link. This file previously had the WRONG content — a duplicate of the
// reset-password route (which needs a dynamic [id] this path doesn't
// have) — meaning "Add New User" was silently broken on the live site,
// even though the form correctly posts here.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  fullName: z.string().min(1, "Full name is required"),
  title: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  userType: z.enum(["Admin", "Councillor"]).default("Admin"),
  canViewReports: z.boolean().default(false),
  canManageRegister: z.boolean().default(false),
  canManageElections: z.boolean().default(false),
  canManageAdminUsers: z.boolean().default(false),
  fullAccess: z.boolean().default(false),
});

export async function POST(request: Request) {
  const actor = await requireAdmin(["users"]);
  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const data = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(data.email);
  if (inviteError || !invited?.user) {
    return NextResponse.json({ ok: false, reason: inviteError?.message ?? "Could not send the invitation." }, { status: 500 });
  }

  const { data: created, error } = await supabase
    .from("admin_users")
    .insert({
      auth_user_id: invited.user.id,
      full_name: data.fullName,
      role: data.title || null,
      phone: data.phone || null,
      user_type: data.userType,
      can_view_reports: data.canViewReports,
      can_manage_register: data.canManageRegister,
      can_manage_elections: data.canManageElections,
      can_manage_admin_users: data.canManageAdminUsers,
      full_access: data.fullAccess,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, reason: "Invitation sent, but the account record could not be created." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_added_user",
    target_table: "admin_users",
    target_id: created.id,
    details: { email: data.email, user_type: data.userType },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
