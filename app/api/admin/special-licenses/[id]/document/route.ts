// Admin-side document upload for an existing special licence — reuses
// the same private "license-documents" storage bucket as the base
// Nurse/Midwife licence documents, just under a "special-" path prefix,
// rather than creating a whole separate bucket for what is structurally
// the same kind of file.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_TYPES, UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_BAD_TYPE_MESSAGE } from "@/lib/uploads";

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const admin = await requireAdmin(["register"]);
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, reason: "No file provided." }, { status: 400 });
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ ok: false, reason: UPLOAD_TOO_LARGE_MESSAGE }, { status: 400 });
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return NextResponse.json({ ok: false, reason: UPLOAD_BAD_TYPE_MESSAGE }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: license } = await supabase.from("special_licenses").select("person_id").eq("id", params.id).single();
  if (!license) return NextResponse.json({ ok: false, reason: "Special licence not found." }, { status: 404 });

  const ext = file.name.split(".").pop() || "bin";
  const path = `${license.person_id}/special-${params.id}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from("license-documents").upload(path, arrayBuffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ ok: false, reason: "Could not upload the file." }, { status: 500 });

  await supabase.from("special_licenses").update({ document_path: path, document_uploaded_by: "admin", document_uploaded_at: new Date().toISOString() }).eq("id", params.id);
  await supabase.from("audit_log").insert({ actor_id: admin.id, action: "admin_uploaded_special_license_document", target_table: "special_licenses", target_id: params.id });

  return NextResponse.json({ ok: true });
}
