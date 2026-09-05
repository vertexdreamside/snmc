import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin(["register"]);
  const supabase = createServiceRoleClient();
  const { data: license } = await supabase.from("special_licenses").select("document_path").eq("id", params.id).single();
  if (!license?.document_path) return NextResponse.json({ ok: false, reason: "No document on file." }, { status: 404 });
  const { data: signed, error } = await supabase.storage.from("license-documents").createSignedUrl(license.document_path, 300);
  if (error || !signed) return NextResponse.json({ ok: false, reason: "Could not generate a link." }, { status: 500 });
  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
