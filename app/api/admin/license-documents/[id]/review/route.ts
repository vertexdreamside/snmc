import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ status: z.enum(["Approved", "Rejected"]) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["register"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: doc, error } = await supabase
    .from("license_documents")
    .update({ status: parsed.data.status, reviewed_by: actor.id, reviewed_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("person_id, license_type")
    .single();

  if (error || !doc) return NextResponse.json({ ok: false, reason: "Document not found." }, { status: 404 });

  await supabase.from("audit_log").insert({
    actor_id: actor.id, action: "admin_reviewed_license_document",
    target_table: "license_documents", target_id: params.id,
    details: { status: parsed.data.status, license_type: doc.license_type, person_id: doc.person_id },
  });

  return NextResponse.json({ ok: true });
}
