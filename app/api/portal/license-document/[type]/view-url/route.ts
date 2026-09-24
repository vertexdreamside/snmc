// Section 1: "Nurse/midwives must be able to log into their portal and
// view/download their approved license document." This never existed —
// only the admin side and Special Licences had view/download; the
// base Nurse/Midwife license document itself had no portal-facing
// access at all. Scoped strictly to the signed-in person's own record —
// license_documents' existing RLS self-select policy (migration 0010)
// enforces this at the database level too, not just here.

import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ type: string }> }) {
  const params = await paramsPromise;
  const licenseType = params.type === "midwife" ? "Midwife" : "Nurse";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const { data: doc } = await admin
    .from("license_documents")
    .select("file_path, status")
    .eq("person_id", person.id)
    .eq("license_type", licenseType)
    .eq("status", "Approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!doc?.file_path) return NextResponse.json({ ok: false, reason: "No approved document on file." }, { status: 404 });

  const { data: signed, error } = await admin.storage.from("license-documents").createSignedUrl(doc.file_path, 300);
  if (error || !signed) return NextResponse.json({ ok: false, reason: "Could not generate a link." }, { status: 500 });
  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
