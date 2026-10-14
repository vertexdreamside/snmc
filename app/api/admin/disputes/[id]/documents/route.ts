// Supporting files for an election dispute (evidence, a written complaint,
// a decision letter, ...). Stored in the same private "license-documents"
// bucket under election-disputes/<dispute id>/ — the files are found by
// listing that folder, so no database change is needed. Several files may
// be attached to one dispute.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_TYPES, UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_BAD_TYPE_MESSAGE } from "@/lib/uploads";

const BUCKET = "license-documents";

function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80) || "file";
}

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const admin = await requireAdmin(["elections"]);
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, reason: "No file provided." }, { status: 400 });
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ ok: false, reason: UPLOAD_TOO_LARGE_MESSAGE }, { status: 400 });
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return NextResponse.json({ ok: false, reason: UPLOAD_BAD_TYPE_MESSAGE }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: dispute } = await supabase.from("election_disputes").select("id, election_id").eq("id", params.id).single();
  if (!dispute) return NextResponse.json({ ok: false, reason: "Dispute not found." }, { status: 404 });

  const path = `election-disputes/${params.id}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ ok: false, reason: "Could not upload the file." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_uploaded_dispute_document",
    target_table: "elections",
    target_id: dispute.election_id,
    details: { dispute_id: params.id, file_name: file.name },
  });

  return NextResponse.json({ ok: true });
}

// Lists the files attached to a dispute, each with a short-lived link.
export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  await requireAdmin(["elections"]);
  const supabase = createServiceRoleClient();
  const folder = `election-disputes/${params.id}`;
  const { data: items, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
  if (error) return NextResponse.json({ ok: false, reason: "Could not list files." }, { status: 500 });

  const files = await Promise.all(
    (items ?? [])
      .filter((i) => i.name && !i.name.startsWith("."))
      .map(async (i) => {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(`${folder}/${i.name}`, 300);
        return { name: i.name.replace(/^\d+-/, ""), url: signed?.signedUrl ?? null };
      })
  );
  return NextResponse.json({ ok: true, files });
}
