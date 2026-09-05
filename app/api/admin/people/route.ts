// Admin edits to a person's record — approve/reject a pending profile
// change, edit fields directly, or mark deceased. Deceased is
// deliberately admin-only (Section 4: "never settable via self-service").

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "mark_deceased", "edit_fields"]),
  fields: z.record(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["register"]);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  let update: Record<string, unknown> = {};
  let action = "";

  switch (parsed.data.action) {
    case "approve":
      update = { profile_status: "Approved" };
      action = "admin_approved_profile";
      break;
    case "reject":
      update = { profile_status: "Rejected" };
      action = "admin_rejected_profile";
      break;
    case "mark_deceased":
      // is_deceased is the ACTUAL eligibility gate as of migration 0009 —
      // registration_status alone no longer means anything for
      // nomination/voting eligibility, so this must set both or marking
      // someone deceased here would silently fail to actually block them.
      update = { registration_status: "Deceased", is_active: false, is_deceased: true };
      action = "admin_marked_deceased";
      break;
    case "edit_fields":
      // Whitelist — never allow this route to touch nin, auth_user_id,
      // nurse_reg_no/midwife_reg_no (those are register-integrity fields,
      // not casual edits) or profile_status/registration_status (those
      // have their own dedicated actions above with proper audit labels).
      const allowed = [
        "first_name",
        "last_name",
        "address_line1",
        "address_line2",
        "address_line3",
        "phone_home",
        "phone_mobile",
        "employer",
        "place_of_work",
        "employment_sector",
        "service_category",
        "training_institute",
      ];
      for (const key of Object.keys(parsed.data.fields ?? {})) {
        if (allowed.includes(key)) update[key] = parsed.data.fields![key];
      }
      action = "admin_edited_fields";
      break;
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabase.from("people").update(update).eq("id", params.id);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action,
    target_table: "people",
    target_id: params.id,
    details: parsed.data.action === "edit_fields" ? update : undefined,
  });

  return NextResponse.json({ ok: true });
}
