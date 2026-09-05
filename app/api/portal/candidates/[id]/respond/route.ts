// A nominee responding to their own nomination — self-service equivalent
// of the admin decision endpoint. Since there's no real email/SMS on file
// for most nurses/midwives (portal login uses a placeholder address for
// the magic-link flow, not a real inbox), an in-app banner on the portal
// home page is currently the only reliable way to actually reach a
// nominee — this is the endpoint that banner's Accept/Decline buttons
// call. Same auto-replacement logic as the admin-side endpoint.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ decision: z.enum(["Accepted", "Declined"]) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: person } = await admin.from("people").select("id").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  const { data: candidate } = await admin
    .from("candidates")
    .select("id, election_id, category, person_id, nomination_count, status")
    .eq("id", params.id)
    .single();

  if (!candidate || candidate.person_id !== person.id) {
    return NextResponse.json({ ok: false, reason: "Nomination not found." }, { status: 404 });
  }
  if (candidate.status !== "Pending") {
    return NextResponse.json({ ok: false, reason: "This nomination isn't awaiting a response." }, { status: 400 });
  }

  await admin.from("candidates").update({
    status: parsed.data.decision,
    decision_recorded_at: new Date().toISOString(),
  }).eq("id", candidate.id);

  let replacement: { id: string; person_id: string } | null = null;
  if (parsed.data.decision === "Declined") {
    const { data: nextBest } = await admin
      .from("candidates")
      .select("id, person_id")
      .eq("election_id", candidate.election_id)
      .eq("category", candidate.category)
      .eq("status", "Nominated")
      .order("nomination_count", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (nextBest) {
      await admin.from("candidates").update({ status: "Pending" }).eq("id", nextBest.id);
      await admin.from("candidates").update({ replaced_by: nextBest.id }).eq("id", candidate.id);
      replacement = nextBest;
    }
  }

  await admin.from("audit_log").insert({
    actor_id: person.id,
    action: "nominee_self_responded",
    target_table: "candidates",
    target_id: candidate.id,
    details: { decision: parsed.data.decision, nomination_count: candidate.nomination_count, replacement_candidate_id: replacement?.id ?? null },
  });

  return NextResponse.json({ ok: true });
}
