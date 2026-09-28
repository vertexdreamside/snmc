import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_TYPES, UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_BAD_TYPE_MESSAGE } from "@/lib/uploads";

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, reason: "No file provided." }, { status: 400 });
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ ok: false, reason: UPLOAD_TOO_LARGE_MESSAGE }, { status: 400 });
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return NextResponse.json({ ok: false, reason: UPLOAD_BAD_TYPE_MESSAGE }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const { data: reqRow } = await admin.from("name_change_requests").select("person_id").eq("id", params.id).single();
  if (!reqRow || reqRow.person_id !== person.id) return NextResponse.json({ ok: false, reason: "Request not found." }, { status: 404 });

  const ext = file.name.split(".").pop() || "bin";
  const path = `${person.id}/name-change-${params.id}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage.from("license-documents").upload(path, arrayBuffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ ok: false, reason: "Could not upload the file." }, { status: 500 });

  await admin.from("name_change_requests").update({ document_path: path }).eq("id", params.id);
  return NextResponse.json({ ok: true });
}
