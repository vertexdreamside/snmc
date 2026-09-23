// Section 3: "Add an optional reason/comment when rejecting" — a
// rejection reason is NOT required here, unlike license document
// rejections (which explicitly do require one). Admins can still add
// one; it's just never enforced as mandatory for this specific
// workflow.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["Approved", "Rejected"]),
  comment: z.string().optional(),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const admin = await requireAdmin(["register"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });

  // No mandatory-comment check here, deliberately — see the comment above.

  const supabase = createServiceRoleClient();
  const { data: reqRow, error: fetchError } = await supabase
    .from("name_change_requests")
    .select("id, person_id, requested_first_name, requested_last_name, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !reqRow) return NextResponse.json({ ok: false, reason: "Request not found." }, { status: 404 });
  if (reqRow.status !== "Pending") {
    return NextResponse.json({ ok: false, reason: `Already ${reqRow.status.toLowerCase()}.` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("name_change_requests")
    .update({
      status: parsed.data.status,
      reviewed_by: admin.id,
      reviewed_at: now,
      review_comment: parsed.data.comment || null,
      applied_at: parsed.data.status === "Approved" ? now : null,
    })
    .eq("id", params.id);

  if (updateError) return NextResponse.json({ ok: false, reason: "Could not record the decision." }, { status: 500 });

  if (parsed.data.status === "Approved") {
    await supabase
      .from("people")
      .update({ first_name: reqRow.requested_first_name, last_name: reqRow.requested_last_name })
      .eq("id", reqRow.person_id);
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: parsed.data.status === "Approved" ? "admin_approved_name_change" : "admin_rejected_name_change",
    target_table: "people",
    target_id: reqRow.person_id,
    details: {
      requested_first_name: reqRow.requested_first_name,
      requested_last_name: reqRow.requested_last_name,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json({ ok: true });
}
