import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_TYPES, UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_BAD_TYPE_MESSAGE } from "@/lib/uploads";

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const actor = await requireAdmin(["register"]);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const licenseType = formData.get("licenseType") as string | null;

  if (!file) return NextResponse.json({ ok: false, reason: "No file provided." }, { status: 400 });
  if (licenseType !== "Nurse" && licenseType !== "Midwife") {
    return NextResponse.json({ ok: false, reason: "licenseType must be Nurse or Midwife." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ ok: false, reason: UPLOAD_TOO_LARGE_MESSAGE }, { status: 400 });
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, reason: UPLOAD_BAD_TYPE_MESSAGE }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: person } = await supabase.from("people").select("id").eq("id", params.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Person not found." }, { status: 404 });

  const ext = file.name.split(".").pop() || "bin";
  const path = `${params.id}/${licenseType.toLowerCase()}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("license-documents")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ ok: false, reason: "Could not upload the file." }, { status: 500 });

  const { data: doc, error: insertError } = await supabase
    .from("license_documents")
    .insert({ person_id: params.id, license_type: licenseType, file_path: path, original_filename: file.name, uploaded_by: actor.id, uploaded_by_role: "admin", status: "Pending" })
    .select("id")
    .single();

  if (insertError) return NextResponse.json({ ok: false, reason: "Uploaded, but could not save the record." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: actor.id, action: "admin_uploaded_license_document",
    target_table: "people", target_id: params.id,
    details: { license_type: licenseType, document_id: doc.id },
  });

  return NextResponse.json({ ok: true, id: doc.id });
}
