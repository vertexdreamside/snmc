import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin(["register"]);
  const supabase = createServiceRoleClient();
  const { data: reqRow } = await supabase.from("name_change_requests").select("document_path").eq("id", params.id).single();
  if (!reqRow?.document_path) return NextResponse.json({ ok: false, reason: "No document on file." }, { status: 404 });
  const { data: signed, error } = await supabase.storage.from("license-documents").createSignedUrl(reqRow.document_path, 300);
  if (error || !signed) return NextResponse.json({ ok: false, reason: "Could not generate a link." }, { status: 500 });
  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
