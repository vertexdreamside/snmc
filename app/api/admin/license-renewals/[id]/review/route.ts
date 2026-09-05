// Approving a renewal request is the ONE place a person's actual licence
// expiry date gets updated from a renewal — never done by manually
// editing the field directly, so there's always a retained record of
// what changed, when, by whom, and from what previous date.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  comment: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["register"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: renewal, error: fetchError } = await supabase
    .from("license_renewals")
    .select("id, person_id, license_type, requested_expiry_date, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !renewal) return NextResponse.json({ ok: false, reason: "Renewal request not found." }, { status: 404 });
  if (renewal.status !== "Pending" && renewal.status !== "Under Review") {
    return NextResponse.json({ ok: false, reason: `Already ${renewal.status.toLowerCase()}.` }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("license_renewals")
    .update({
      status: parsed.data.status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_comment: parsed.data.comment || null,
    })
    .eq("id", params.id);

  if (updateError) return NextResponse.json({ ok: false, reason: "Could not update the renewal request." }, { status: 500 });

  if (parsed.data.status === "Approved") {
    const expiryColumn = renewal.license_type === "Nurse" ? "nurse_license_expiry" : "midwife_license_expiry";
    await supabase.from("people").update({ [expiryColumn]: renewal.requested_expiry_date }).eq("id", renewal.person_id);
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: parsed.data.status === "Approved" ? "admin_approved_license_renewal" : "admin_rejected_license_renewal",
    target_table: "people",
    target_id: renewal.person_id,
    details: {
      license_type: renewal.license_type,
      requested_expiry_date: renewal.requested_expiry_date,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json({ ok: true });
}
