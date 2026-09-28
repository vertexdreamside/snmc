import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_TYPES, UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_BAD_TYPE_MESSAGE } from "@/lib/uploads";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

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

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const ext = file.name.split(".").pop() || "bin";
  const path = `${person.id}/${licenseType.toLowerCase()}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage.from("license-documents").upload(path, arrayBuffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ ok: false, reason: "Could not upload the file." }, { status: 500 });

  const { error: insertError } = await admin.from("license_documents").insert({
    person_id: person.id, license_type: licenseType, file_path: path,
    original_filename: file.name, uploaded_by: person.id, uploaded_by_role: "self", status: "Pending",
  });
  if (insertError) return NextResponse.json({ ok: false, reason: "Uploaded, but could not save the record." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
