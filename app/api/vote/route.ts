// Casts a single ballot. This is the one place in the codebase that must
// get anonymity right: vote_participation records THAT someone voted,
// ballots records WHAT was voted for, and the two are never joined by a
// shared foreign key back to the voter. See Section 3.3 of the build spec.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isEligible, serviceCategoryMatches } from "@/lib/auth/eligibility";
import { SNMC_CONTACT } from "@/lib/components/ContactFooter";

const castVoteSchema = z.object({
  electionId: z.string().uuid(),
  round: z.literal(2), // Round 1 is nomination-only; the ballot only exists in Round 2. See build spec.
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
    .select("id, professional_category, is_deceased, category_confirmed, service_category")
    .eq("auth_user_id", user.id)
    .single();

  if (!person) {
    return NextResponse.json({ ok: false, reason: "Voter record not found." }, { status: 403 });
  }

  // Eligibility now goes through lib/auth/eligibility (Section 4/13 of
  // the confirmed election rules) rather than checking registration_status
  // directly — a real correction: the previous check required
  // registration_status === 'Practising', which would have wrongly
  // excluded Retired and Non-Active nurses/midwives the Council
  // explicitly confirmed ARE eligible. Only is_deceased disqualifies now.
  const eligibility = isEligible(person, category);
  if (!eligibility.eligible) {
    const reason = eligibility.reason?.includes("confirmed")
      ? `${eligibility.reason} Please contact the Council office at ${SNMC_CONTACT.phone} or ${SNMC_CONTACT.email}.`
      : eligibility.reason;
    return NextResponse.json({ ok: false, reason }, { status: 403 });
  }

  const { data: election } = await supabase.from("elections").select("status").eq("id", electionId).single();
  if (!election || election.status !== "Election Open") {
    return NextResponse.json({ ok: false, reason: "Voting is not currently open." }, { status: 403 });
  }

  // Use the service-role client for the actual writes so we can do them as
  // one transaction-like sequence without the user's own RLS grants having
  // to cover an insert into `ballots` (which — by design — no authenticated
  // role can write to directly; only this trusted server path can).
  const admin = createServiceRoleClient();

  // Candidate must actually be on the real ballot — Section 3 of the
  // confirmed rules requires a nominee to have actively ACCEPTED
  // participation, not merely been selected ('Pending') by the admin.
  const { data: candidate } = await admin
    .from("candidates")
    .select("id, status, service_category")
    .eq("id", candidateId)
    .eq("election_id", electionId)
    .eq("category", category)
    .maybeSingle();

  if (!candidate || candidate.status !== "Accepted") {
    return NextResponse.json({ ok: false, reason: "That candidate isn't on the ballot." }, { status: 400 });
  }

  // Service-category enforcement (confirmed addendum) — this is the
  // REAL check; the vote page hiding non-matching candidates is only a
  // UI convenience and isn't itself a security boundary. A direct API
  // call with a mismatched candidateId must still be rejected here.
  if (!serviceCategoryMatches(person.service_category, candidate.service_category)) {
    return NextResponse.json({ ok: false, reason: "You can only vote for candidates in your own service area." }, { status: 403 });
  }

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
      { ok: false, reason: `Something went wrong recording your ballot. Please contact the Council office at ${SNMC_CONTACT.phone} or ${SNMC_CONTACT.email}.` },
      { status: 500 }
    );
  }

  // CRITICAL: this logs only that a vote happened — election, round,
  // category, and voter. It must NEVER include candidateId or anything
  // that could be joined back to what was actually voted for. This is
  // the same anonymity boundary vote_participation/ballots already
  // enforce at the schema level (Section 7 of the confirmed election
  // rules) — the audit trail exists to prove participation, not to leak
  // the one thing this whole architecture is built to protect.
  await admin.from("audit_log").insert({
    actor_id: person.id,
    action: "vote_cast",
    target_table: "vote_participation",
    details: { election_id: electionId, round, category },
  });

  return NextResponse.json({ ok: true });
}
