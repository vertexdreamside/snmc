// Self-service profile update. Per explicit direction: a nurse/midwife
// may edit everything about their own record EXCEPT their registration
// numbers (nurse_reg_no, midwife_reg_no) — those are the register's own
// identifiers, not personal details, and stay admin-only.
//
// Licence number and expiry are ALSO excluded here — a real fix, not
// part of the original design. They were previously editable through
// this same route as free text, which quietly undermined the dedicated
// Licence Renewal workflow (Section 5): someone could just retype their
// expiry date here and have it go through as an ordinary profile edit,
// with no renewal history, no supporting document, and none of that
// workflow's review structure. Expiry changes now only ever happen
// through /api/portal/license-renewal; licence number corrections go
// through the Council office directly, same as registration numbers.
//
// Deliberately still excluded even under that broad mandate: the
// system/administrative fields (registration_status, is_active,
// profile_status, category_confirmed, auth_user_id, data_source, notes).
// These aren't "details about a person" a self-service form should ever
// touch — they're the Council's own verification/approval state, and
// migration 0003 exists specifically because letting a signed-in person
// write those columns directly was a real privilege-escalation bug, not
// a hypothetical one. NIN IS included below (it's a personal detail the
// person themselves is the actual source of truth for) — see the note
// in lib/auth/identify.ts on why this also means a self-submitted NIN
// starts being enforced at login immediately, which is a feature here,
// not an oversight: it's how the register's missing NIN data actually
// gets filled in over time.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const EDITABLE_FIELDS = [
  "first_name", "last_name", "sex", "date_of_birth", "nin",
  "address_line1", "address_line2", "address_line3", "phone_home", "phone_mobile",
  "employer", "place_of_work", "employment_sector", "service_category", "training_institute",
] as const;

const profileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  sex: z.enum(["M", "F", "Unknown"]).optional(),
  date_of_birth: z.string().optional().nullable(),
  nin: z.string().optional().default(""),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional().default(""),
  address_line3: z.string().optional().default(""),
  phone_home: z.string().optional().default(""),
  phone_mobile: z.string().min(1, "A mobile number is required"),
  employer: z.string().min(1, "Employer is required"),
  place_of_work: z.string().min(1, "Place of work is required"),
  employment_sector: z.enum(["Government", "Private"]).optional(),
  service_category: z.enum(["Hospital", "Community", "Private", "Unspecified"]).optional(),
  training_institute: z.string().optional().default(""),
  reasonForChange: z.string().optional(),
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
  const { data: existing } = await admin.from("people").select(EDITABLE_FIELDS.join(", ")).eq("auth_user_id", user.id).single();
  if (!existing) {
    return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });
  }
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) {
    return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });
  }

  // Normalize empty-string date inputs to null rather than writing "" into
  // a date column. reasonForChange is destructured out here specifically —
  // it's not a people column, and left in `cleaned` it would get spread
  // straight into the update() call below and error.
  const { reasonForChange, ...dataFields } = parsed.data;
  const cleaned = {
    ...dataFields,
    date_of_birth: parsed.data.date_of_birth || null,
  };

  // Build an actual before/after diff of only what's genuinely changing —
  // this is what lets the admin's Pending Approval queue show real
  // content instead of just "profile_status changed."
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in cleaned) {
      const newVal = (cleaned as Record<string, unknown>)[field];
      const oldVal = (existing as Record<string, unknown>)[field];
      if (newVal !== oldVal && !(newVal == null && oldVal == null)) {
        changes[field] = { from: oldVal ?? null, to: newVal ?? null };
      }
    }
  }

  const { error } = await admin
    .from("people")
    .update({
      ...cleaned,
      profile_status: "Pending Review", // every self-edit requires re-approval — see migration 0003
      updated_at: new Date().toISOString(),
    })
    .eq("id", person.id);

  if (error) {
    return NextResponse.json({ ok: false, reason: "Could not save your changes." }, { status: 500 });
  }

  // Same "reference" pattern as the vote receipt — something the person
  // can quote if they contact the Council office about this specific
  // submission, without needing to describe it in words.
  let reference: string | undefined;
  if (Object.keys(changes).length > 0) {
    const { data: logRow } = await admin
      .from("audit_log")
      .insert({
        actor_id: person.id,
        action: "self_service_profile_update",
        target_table: "people",
        target_id: person.id,
        details: { changes, reason: reasonForChange || undefined },
      })
      .select("id")
      .single();
    reference = logRow?.id ? logRow.id.slice(0, 8).toUpperCase() : undefined;
  }

  return NextResponse.json({ ok: true, reference });
}
