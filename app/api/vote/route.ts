// Casts a single ballot. This is the one place in the codebase that must
// get anonymity right: vote_participation records THAT someone voted,
// ballots records WHAT was voted for, and the two are never joined by a
// shared foreign key back to the voter. See Section 3.3 of the build spec.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const castVoteSchema = z.object({
  electionId: z.string().uuid(),
  round: z.number().int().min(1).max(2),
  category: z.enum(["Nurse", "Midwife"]),
  candidateId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = createClient(); // user-scoped, so we know exactly who's asking
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = castVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }
  const { electionId, round, category, candidateId } = parsed.data;

  const { data: person } = await supabase
    .from("people")
    .select("id, professional_category, registration_status, nurse_license_expiry, midwife_license_expiry")
    .eq("auth_user_id", user.id)
    .single();

  if (!person) {
    return NextResponse.json({ ok: false, reason: "Voter record not found." }, { status: 403 });
  }

  // Eligibility check — see Section 3.4 and open item Section 10 #4 for
  // exactly which statuses should count; this enforces the conservative
  // default (Practising only) until the Council confirms otherwise.
  if (person.registration_status !== "Practising") {
    return NextResponse.json({ ok: false, reason: "You're not currently eligible to vote." }, { status: 403 });
  }
  const canVoteCategory =
    person.professional_category === "Both" || person.professional_category === category;
  if (!canVoteCategory) {
    return NextResponse.json({ ok: false, reason: `You're not eligible to vote in the ${category} category.` }, { status: 403 });
  }

  const { data: election } = await supabase.from("elections").select("status").eq("id", electionId).single();
  const expectedStatus = round === 1 ? "Round 1 Open" : "Round 2 Open";
  if (!election || election.status !== expectedStatus) {
    return NextResponse.json({ ok: false, reason: "Voting is not currently open for this round." }, { status: 403 });
  }

  // Use the service-role client for the actual writes so we can do them as
  // one transaction-like sequence without the user's own RLS grants having
  // to cover an insert into `ballots` (which — by design — no authenticated
  // role can write to directly; only this trusted server path can).
  const admin = createServiceRoleClient();

  const { error: participationError } = await admin.from("vote_participation").insert({
    election_id: electionId,
    round,
    category,
    voter_id: person.id,
  });

  if (participationError) {
    // Most likely the unique constraint on (election_id, round, category, voter_id)
    if (participationError.code === "23505") {
      return NextResponse.json({ ok: false, reason: "You've already voted in this round." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, reason: "Could not record your vote. Please try again." }, { status: 500 });
  }

  const { error: ballotError } = await admin.from("ballots").insert({
    election_id: electionId,
    round,
    category,
    candidate_id: candidateId,
  });

  if (ballotError) {
    // Participation was already recorded, so don't silently leave that
    // inconsistent — flag for admin attention rather than letting the
    // person re-vote (which would break the one-vote guarantee).
    await admin.from("audit_log").insert({
      actor_id: person.id,
      action: "vote_ballot_insert_failed_after_participation_recorded",
      target_table: "ballots",
      details: { electionId, round, category },
    });
    return NextResponse.json(
      { ok: false, reason: "Something went wrong recording your ballot. Please contact the Council office." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
