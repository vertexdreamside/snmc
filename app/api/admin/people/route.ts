// Creates a new nurse/midwife record directly from the admin panel —
// previously the only ways to add someone were a bulk CSV import or
// directly in Supabase. Starts as 'Approved' (an admin entering this has
// already reviewed it), unlike a self-service edit which always resets
// to 'Pending Review'. auth_user_id is left null — it self-heals the
// first time this person successfully logs in.
//
// NIN is mandatory here (Section 4 of the confirmed UX requirements) —
// unlike the self-service portal, which allows leaving it blank if
// already on file, there's no "already on file" case for a brand new
// record. Email is stored in the separate people_emails table (the
// people table itself has no email column) and is optional — the
// requirements ask for the field, not that every historical record
// must have one before it can be created.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const createPersonSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  sex: z.enum(["M", "F"]),
  nin: z.string().min(1, "N.I.N is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  nurse_reg_no: z.string().optional().default(""),
  midwife_reg_no: z.string().optional().default(""),
  professional_category: z.enum(["Nurse", "Midwife", "Both"]),
  registration_status: z
    .enum(["Practising", "Not Practising", "Retired", "Abroad", "Deceased"])
    .default("Practising"),
  is_deceased: z.boolean().default(false),
  employer: z.string().optional().default(""),
  place_of_work: z.string().optional().default(""),
  phone_mobile: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const actor = await requireAdmin(["register"]);

  const body = await request.json();
  const parsed = createPersonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const data = parsed.data;

  if (!data.nurse_reg_no && !data.midwife_reg_no) {
    return NextResponse.json({ ok: false, reason: "At least one registration number is required." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: created, error } = await supabase
    .from("people")
    .insert({
      first_name: data.first_name,
      last_name: data.last_name,
      sex: data.sex,
      nin: data.nin,
      nurse_reg_no: data.nurse_reg_no || null,
      midwife_reg_no: data.midwife_reg_no || null,
      professional_category: data.professional_category ?? null,
      registration_status: data.registration_status,
      is_deceased: data.is_deceased,
      employer: data.employer || null,
      place_of_work: data.place_of_work || null,
      phone_mobile: data.phone_mobile || null,
      profile_status: "Approved",
      category_confirmed: !!data.professional_category,
      data_source: "Manually added by admin",
    })
    .select("id")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ ok: false, reason: "That registration number is already in use." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, reason: "Could not create the record." }, { status: 500 });
  }

  if (data.email) {
    await supabase.from("people_emails").insert({ person_id: created.id, email: data.email });
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_created_person",
    target_table: "people",
    target_id: created.id,
    details: { first_name: data.first_name, last_name: data.last_name },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
