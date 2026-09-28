// Admin-side upload of the signed Minister Approval document for an
// election. Reuses the same private "license-documents" storage bucket
// as the base licence/special-licence documents (structurally the same
// kind of file — one attached document per record) rather than
// introducing a separate bucket, following the same pattern already
// used for special_licenses (see app/api/admin/special-licenses/[id]/document/route.ts).
//
// Only meaningful once approval_status is "Approved" — enforced here as
// well as by only showing the upload control in that state in the UI —
// so a document can't be attached to an election that hasn't actually
// been approved yet.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_TYPES, UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_BAD_TYPE_MESSAGE } from "@/lib/uploads";

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const admin = await requireAdmin(["elections"]);
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, reason: "No file provided." }, { status: 400 });
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ ok: false, reason: UPLOAD_TOO_LARGE_MESSAGE }, { status: 400 });
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return NextResponse.json({ ok: false, reason: UPLOAD_BAD_TYPE_MESSAGE }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: election } = await supabase.from("elections").select("id, approval_status").eq("id", params.id).single();
  if (!election) return NextResponse.json({ ok: false, reason: "Election not found." }, { status: 404 });
  if (election.approval_status !== "Approved") {
    return NextResponse.json({ ok: false, reason: "Minister Approval must be recorded before attaching the approval document." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `election-approvals/${params.id}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from("license-documents").upload(path, arrayBuffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ ok: false, reason: "Could not upload the file." }, { status: 500 });

  await supabase
    .from("elections")
    .update({ approval_document_path: path, approval_document_uploaded_by: admin.id, approval_document_uploaded_at: new Date().toISOString() })
    .eq("id", params.id);

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_uploaded_election_approval_document",
    target_table: "elections",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
