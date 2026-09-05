// Nomination submission — digitizes the historical paper Nomination
// Form's exact rule set. Eligibility goes through lib/auth/eligibility
// (Section 4/13 of the confirmed election rules) rather than checking
// registration_status directly — a real correction: the previous check
// required registration_status === 'Practising', which would have
// wrongly excluded Retired and Non-Active nurses/midwives the Council
// explicitly confirmed ARE eligible. Only is_deceased disqualifies now.
//
// Writes to TWO tables (migration 0008): nominations (the source-of-
// truth event log — its unique constraint is what actually stops the
// same nominator nominating the same person twice, not application logic
// alone) and candidates (upserted: nomination_count increments if this
// exact election/person/category already has a row).

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isEligible } from "@/lib/auth/eligibility";
import { SNMC_CONTACT } from "@/lib/components/ContactFooter";

const nominateSchema = z.object({
  electionId: z.string().uuid(),
  category: z.enum(["Nurse", "Midwife"]),
  candidatePersonId: z.string().uuid(),
  currentPlacement: z.string().min(1, "Current placement is required"),
  serviceCategory: z.enum(["Hospital", "Community", "Private"]),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = nominateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }
  const { electionId, category, candidatePersonId, currentPlacement, serviceCategory } = parsed.data;

  const { data: nominator } = await supabase
    .from("people")
    .select("id, professional_category, is_deceased, category_confirmed")
    .eq("auth_user_id", user.id)
    .single();

  if (!nominator) {
    return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 403 });
  }

  const eligibility = isEligible(nominator, category);
  if (!eligibility.eligible) {
    const reason = eligibility.reason?.includes("confirmed")
      ? `${eligibility.reason} Please contact the Council office at ${SNMC_CONTACT.phone} or ${SNMC_CONTACT.email}.`
      : eligibility.reason;
    return NextResponse.json({ ok: false, reason }, { status: 403 });
  }

  const { data: election } = await supabase.from("elections").select("status").eq("id", electionId).single();
  if (!election || election.status !== "Nomination Open") {
    return NextResponse.json({ ok: false, reason: "Nominations aren't currently open for this election." }, { status: 403 });
  }

  const admin = createServiceRoleClient();

  const { error: nominationError } = await admin.from("nominations").insert({
    election_id: electionId,
    person_id: candidatePersonId,
    category,
    nominated_by: nominator.id,
    current_placement_note: currentPlacement,
    service_category: serviceCategory,
  });

  if (nominationError) {
    const err = nominationError as { code?: string; message?: string };
    if (err.code === "23505") {
      // Two different constraints can trigger this — distinguish which
      // one so the message is actually accurate. The new one-per-voter
      // rule is the far more likely case now (Section 10 of the
      // confirmed election rules): a voter gets exactly one nomination
      // per round, not one per candidate.
      if (err.message?.includes("nominations_one_per_voter_per_category")) {
        return NextResponse.json(
          { ok: false, reason: "You've already submitted your nomination for this round. You cannot submit another nomination during this nomination round." },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, reason: "You've already nominated this candidate." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, reason: "Could not submit the nomination." }, { status: 500 });
  }

  const { data: existing } = await admin
    .from("candidates")
    .select("id, nomination_count, service_category")
    .eq("election_id", electionId)
    .eq("person_id", candidatePersonId)
    .eq("category", category)
    .maybeSingle();

  if (existing) {
    // Sector is set once, by whoever nominates this person first — a
    // later nominator specifying a different sector doesn't silently
    // overwrite it (that could let one nominator quietly move someone
    // into a different voting pool). Flagged in the audit log instead.
    const { error: updateError } = await admin
      .from("candidates")
      .update({ nomination_count: existing.nomination_count + 1, current_placement_note: currentPlacement })
      .eq("id", existing.id);
    if (updateError) return NextResponse.json({ ok: false, reason: "Could not record the nomination." }, { status: 500 });
    if (existing.service_category && existing.service_category !== serviceCategory) {
      await admin.from("audit_log").insert({
        actor_id: nominator.id,
        action: "nomination_sector_mismatch_flagged",
        target_table: "candidates",
        target_id: existing.id,
        details: { existing_sector: existing.service_category, submitted_sector: serviceCategory },
      });
    }
  } else {
    const { error: insertError } = await admin.from("candidates").insert({
      election_id: electionId,
      person_id: candidatePersonId,
      category,
      nominated_by: nominator.id,
      current_placement_note: currentPlacement,
      service_category: serviceCategory,
      round: 1,
      status: "Nominated",
      nomination_count: 1,
    });
    if (insertError) return NextResponse.json({ ok: false, reason: "Could not record the nomination." }, { status: 500 });
  }

  // Nominations aren't anonymous (unlike votes) — the historical paper
  // form always identified the nominator, and the Council needs to know
  // who nominated whom to review legitimacy.
  await admin.from("audit_log").insert({
    actor_id: nominator.id,
    action: "nomination_submitted",
    target_table: "candidates",
    target_id: candidatePersonId,
    details: { election_id: electionId, category, nominated_by: nominator.id },
  });

  return NextResponse.json({ ok: true });
}
