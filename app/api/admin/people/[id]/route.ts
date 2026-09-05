// Admin edits to a person's record — approve/reject a pending profile
// change, edit fields directly, or mark deceased. Deceased is
// deliberately admin-only (Section 4: "never settable via self-service").

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { validateLicenseFormat } from "@/lib/licenses";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "mark_deceased", "edit_fields"]),
  fields: z.record(z.string()).optional(),
  comment: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["register"]);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  // Enforced here, not just in the UI — a direct API call must not be
  // able to reject a profile change with no explanation, per the
  // confirmed Admin/Councillor UX requirements ("If rejecting, require:
  // Reason for rejection").
  if (parsed.data.action === "reject" && !parsed.data.comment?.trim()) {
    return NextResponse.json({ ok: false, reason: "A reason for rejection is required." }, { status: 400 });
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
      // Licence numbers ARE editable here, but format-validated — Nurse
      // licences must start with "LN", Midwife licences with "MW".
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
        "nurse_license_no",
        "midwife_license_no",
        "nurse_license_expiry",
        "midwife_license_expiry",
      ];
      for (const key of Object.keys(parsed.data.fields ?? {})) {
        if (!allowed.includes(key)) continue;
        const value = parsed.data.fields![key];
        if (value === undefined) continue;
        if (key === "nurse_license_no") {
          const check = validateLicenseFormat("nurse", value);
          if (!check.valid) return NextResponse.json({ ok: false, reason: check.reason }, { status: 400 });
        }
        if (key === "midwife_license_no") {
          const check = validateLicenseFormat("midwife", value);
          if (!check.valid) return NextResponse.json({ ok: false, reason: check.reason }, { status: 400 });
        }
        update[key] = value;
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
    // Review comment is visible to the person on their own profile page
    // (see app/portal/(authenticated)/profile/page.tsx) — a rejected
    // edit with no explanation gives someone no way to know what to fix.
    // If this should be admin-only instead, that display point is the
    // one place to change.
    details:
      parsed.data.action === "edit_fields"
        ? update
        : parsed.data.comment
          ? { comment: parsed.data.comment }
          : undefined,
  });

  return NextResponse.json({ ok: true });
}
