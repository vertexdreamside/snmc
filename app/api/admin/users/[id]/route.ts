// Edits a single field on an admin user (title, any permission flag, or
// is_disabled), or removes them entirely. This file previously had the
// WRONG content — a duplicate of the reset-password route's handler —
// meaning permission toggles, title edits, disabling, and removal were
// all silently broken on the live site, even though the UI called this
// exact path correctly.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = [
  "role",
  "can_view_reports",
  "can_manage_register",
  "can_manage_elections",
  "can_manage_admin_users",
  "full_access",
  "is_disabled",
] as const;

const patchSchema = z.object({
  field: z.enum(ALLOWED_FIELDS),
  value: z.union([z.boolean(), z.string()]),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["users"]);
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  // Guard against locking yourself out entirely.
  if (params.id === actor.id && parsed.data.field === "full_access" && parsed.data.value === false) {
    return NextResponse.json({ ok: false, reason: "You can't remove your own Full Access." }, { status: 400 });
  }
  if (params.id === actor.id && parsed.data.field === "is_disabled" && parsed.data.value === true) {
    return NextResponse.json({ ok: false, reason: "You can't disable your own account." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("admin_users")
    .update({ [parsed.data.field]: parsed.data.value })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_updated_admin_user",
    target_table: "admin_users",
    target_id: params.id,
    details: { field: parsed.data.field, value: parsed.data.value },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["users"]);

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
