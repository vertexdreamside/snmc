// Self-service renewal request — a nurse/midwife proposes a new expiry
// date (from their renewed physical certificate) and it enters Pending
// review, distinct from just uploading a document. Approving it is what
// actually updates the person's real licence expiry date — this route
// never touches that column directly.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  licenseType: z.enum(["Nurse", "Midwife"]),
  requestedExpiryDate: z.string().min(1, "New expiry date is required"),
  supportingDocumentId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const expiryColumn = parsed.data.licenseType === "Nurse" ? "nurse_license_expiry" : "midwife_license_expiry";
  const { data: person } = await admin.from("people").select(`id, ${expiryColumn}`).eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const { error } = await admin.from("license_renewals").insert({
    person_id: person.id,
    license_type: parsed.data.licenseType,
    previous_expiry_date: (person as Record<string, unknown>)[expiryColumn] ?? null,
    requested_expiry_date: parsed.data.requestedExpiryDate,
    supporting_document_id: parsed.data.supportingDocumentId ?? null,
    status: "Pending",
  });

  if (error) return NextResponse.json({ ok: false, reason: "Could not submit the renewal request." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
