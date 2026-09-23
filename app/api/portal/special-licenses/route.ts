// Self-service special licence submission — enters as Pending, same
// approval workflow as any other profile change (Section 13.7/13.8).
// Never immediately applied like an admin-added one.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  licenseName: z.string().min(1, "Licence name is required"),
  licenseNumber: z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const { error } = await admin.from("special_licenses").insert({
    person_id: person.id,
    license_name: parsed.data.licenseName,
    license_number: parsed.data.licenseNumber || null,
    issued_date: parsed.data.issuedDate || null,
    expiry_date: parsed.data.expiryDate || null,
    notes: parsed.data.notes || null,
    status: "Pending",
    source: "self",
  });

  if (error) return NextResponse.json({ ok: false, reason: "Could not submit the special licence." }, { status: 500 });

  await admin.from("audit_log").insert({
    actor_id: person.id,
    action: "self_submitted_special_license",
    target_table: "special_licenses",
    target_id: person.id,
    details: { license_name: parsed.data.licenseName },
  });

  return NextResponse.json({ ok: true });
}
