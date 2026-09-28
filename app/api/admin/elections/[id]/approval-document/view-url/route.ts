import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  await requireAdmin(["elections"]);
  const supabase = createServiceRoleClient();
  const { data: election } = await supabase.from("elections").select("approval_document_path").eq("id", params.id).single();
  if (!election?.approval_document_path) return NextResponse.json({ ok: false, reason: "No document on file." }, { status: 404 });
  const { data: signed, error } = await supabase.storage.from("license-documents").createSignedUrl(election.approval_document_path, 300);
  if (error || !signed) return NextResponse.json({ ok: false, reason: "Could not generate a link." }, { status: 500 });
  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
