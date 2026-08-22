// Nomination submission — digitizes the historical paper Nomination Form's
// exact rule set:
//   "Only a Registered Licensed Nurse Midwife is permitted to elect
//    [nominate] a Licensed Nurse and a Licensed Midwife.
//    A Registered Licensed Nurse is permitted to elect [nominate] a
//    Nurse only. A Licensed Midwife who is not a Registered Licensed
//    Nurse, may only elect [nominate] a Licensed Midwife."
// Same eligibility rule the vote API already enforces (Section 3.2).

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { SNMC_CONTACT } from "@/lib/components/ContactFooter";

const nominateSchema = z.object({
  electionId: z.string().uuid(),
  category: z.enum(["Nurse", "Midwife"]),
  candidatePersonId: z.string().uuid(),
  currentPlacement: z.string().min(1, "Current placement is required"),
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
  const { electionId, category, candidatePersonId, currentPlacement } = parsed.data;

  const { data: nominator } = await supabase
    .from("people")
    .select("id, professional_category, registration_status, category_confirmed")
    .eq("auth_user_id", user.id)
    .single();

  if (!nominator || nominator.registration_status !== "Practising") {
    return NextResponse.json({ ok: false, reason: "You're not currently eligible to nominate." }, { status: 403 });
  }
  if (!nominator.category_confirmed) {
    return NextResponse.json(
      { ok: false, reason: `Your Nurse/Midwife category hasn't been confirmed by the Council yet. Please contact the Council office at ${SNMC_CONTACT.phone} or ${SNMC_CONTACT.email}.` },
      { status: 403 }
    );
  }
  const canNominateCategory =
    nominator.professional_category === "Both" || nominator.professional_category === category;
  if (!canNominateCategory) {
    return NextResponse.json(
      { ok: false, reason: `You're only eligible to nominate in the ${nominator.professional_category} category.` },
      { status: 403 }
    );
  }

  const { data: election } = await supabase.from("elections").select("status").eq("id", electionId).single();
  // Round 1 = nomination collection (per the historical Nomination Form
  // and Ballot Form this digitizes — see build spec).
  if (!election || election.status !== "Nomination Open") {
    return NextResponse.json({ ok: false, reason: "Nominations aren't currently open for this election." }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.from("candidates").insert({
    election_id: electionId,
    person_id: candidatePersonId,
    category,
    nominated_by: nominator.id,
    current_placement_note: currentPlacement, // see migration note below
    round: 1,
    status: "Nominated",
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: "Could not submit the nomination." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
