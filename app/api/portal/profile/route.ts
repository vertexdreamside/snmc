// Self-service KYC/profile update. Deliberately narrow: only fields a
// person should be able to change about themselves. Never nin,
// nurse_reg_no, midwife_reg_no, registration_status, is_active,
// profile_status, or data_source — those stay admin-only (see
// migration 0003 for why direct client writes to `people` are blocked
// entirely, not just narrowed in the UI).

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const profileUpdateSchema = z.object({
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional().default(""),
  address_line3: z.string().optional().default(""),
  phone_home: z.string().optional().default(""),
  phone_mobile: z.string().min(1, "A mobile number is required"),
  employer: z.string().min(1, "Employer is required"),
  place_of_work: z.string().min(1, "Place of work is required"),
  employment_sector: z.enum(["Government", "Private"]),
  training_institute: z.string().optional().default(""),
});

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) {
    return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });
  }

  const { error } = await admin
    .from("people")
    .update({
      ...parsed.data,
      profile_status: "Pending Review", // every self-edit requires re-approval — see migration 0003
      updated_at: new Date().toISOString(),
    })
    .eq("id", person.id);

  if (error) {
    return NextResponse.json({ ok: false, reason: "Could not save your changes." }, { status: 500 });
  }

  await admin.from("audit_log").insert({
    actor_id: person.id,
    action: "self_service_profile_update",
    target_table: "people",
    target_id: person.id,
  });

  return NextResponse.json({ ok: true });
}
