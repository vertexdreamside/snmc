import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const { data: license } = await admin.from("special_licenses").select("person_id, document_path").eq("id", params.id).single();
  if (!license || license.person_id !== person.id || !license.document_path) {
    return NextResponse.json({ ok: false, reason: "Document not found." }, { status: 404 });
  }

  const { data: signed, error } = await admin.storage.from("license-documents").createSignedUrl(license.document_path, 300);
  if (error || !signed) return NextResponse.json({ ok: false, reason: "Could not generate a link." }, { status: 500 });
  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
