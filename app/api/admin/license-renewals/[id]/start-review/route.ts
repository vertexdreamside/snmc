import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["register"]);
  const supabase = createServiceRoleClient();

  const { data: renewal } = await supabase.from("license_renewals").select("id, status, person_id").eq("id", params.id).single();
  if (!renewal) return NextResponse.json({ ok: false, reason: "Renewal request not found." }, { status: 404 });
  if (renewal.status !== "Pending") {
    return NextResponse.json({ ok: false, reason: `Already ${renewal.status.toLowerCase()}.` }, { status: 400 });
  }

  await supabase.from("license_renewals").update({ status: "Under Review" }).eq("id", params.id);
  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_started_renewal_review",
    target_table: "people",
    target_id: renewal.person_id,
  });

  return NextResponse.json({ ok: true });
}
