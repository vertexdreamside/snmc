import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin(["register"]);
  const supabase = createServiceRoleClient();

  const { data: doc } = await supabase.from("license_documents").select("file_path").eq("id", params.id).single();
  if (!doc) return NextResponse.json({ ok: false, reason: "Document not found." }, { status: 404 });

  const { data: signed, error } = await supabase.storage.from("license-documents").createSignedUrl(doc.file_path, 300);
  if (error || !signed) return NextResponse.json({ ok: false, reason: "Could not generate a link." }, { status: 500 });

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
