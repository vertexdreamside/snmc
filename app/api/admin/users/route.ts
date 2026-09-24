// Creates a new Admin User or Councillor account. Section 4's exact bug
// report: "Email rate limit exceeded" was blocking account creation
// entirely, because inviteUserByEmail() couples two separate things
// into one call — creating the auth user, AND having Supabase's own
// (rate-limited) email service send the invite — with no way to
// succeed at one without the other. If the email leg failed for any
// reason, this returned early and never even created the admin_users
// row.
//
// Fixed by switching to generateLink(), which creates the auth user and
// returns a real invite link WITHOUT ever sending an email — there is
// no email step here at all to rate-limit. The link is returned to the
// admin doing the creating, so they can copy and share it however they
// want (a message, in person, whatever the Council actually uses) — a
// more reliable design than depending on Supabase's default email
// sending for something this important, not just a workaround.

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
  const siteOrigin = new URL(request.url).origin;

  const { data: linked, error: linkError } = await supabase.auth.admin.generateLink({
    type: "invite",
    email: data.email,
    options: { redirectTo: `${siteOrigin}/auth/callback?next=${encodeURIComponent("/admin")}` },
  });
  if (linkError || !linked?.user) {
    return NextResponse.json({ ok: false, reason: linkError?.message ?? "Could not create the account." }, { status: 500 });
  }

  const { data: created, error } = await supabase
    .from("admin_users")
    .insert({
      auth_user_id: linked.user.id,
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
    return NextResponse.json({ ok: false, reason: "Could not create the account record." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_added_user",
    target_table: "admin_users",
    target_id: created.id,
    details: { email: data.email, user_type: data.userType },
  });

  return NextResponse.json({ ok: true, id: created.id, inviteLink: linked.properties?.action_link ?? null });
}
