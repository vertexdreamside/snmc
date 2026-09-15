// Self-service name change request — captures the CURRENT name as
// previous_first_name/previous_last_name at the moment of submission,
// then enters Pending. Nothing in this route ever touches
// people.first_name/last_name directly — only the admin approval
// endpoint does that, and only on approval.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  requestedFirstName: z.string().min(1, "New first name is required"),
  requestedLastName: z.string().min(1, "New last name is required"),
  reason: z.enum(["Marriage", "Divorce", "Legal Change of Name", "Other"]),
  reasonNotes: z.string().optional(),
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
  const { data: person } = await admin.from("people").select("id, first_name, last_name").eq("auth_user_id", user.id).single();
  if (!person) return NextResponse.json({ ok: false, reason: "Profile not found." }, { status: 404 });

  // Only one pending request at a time — a second submission while one
  // is still under review would be genuinely ambiguous (which one wins?).
  const { count: existingPending } = await admin
    .from("name_change_requests")
    .select("*", { count: "exact", head: true })
    .eq("person_id", person.id)
    .eq("status", "Pending");
  if ((existingPending ?? 0) > 0) {
    return NextResponse.json({ ok: false, reason: "You already have a name change request awaiting review." }, { status: 409 });
  }

  const { data: created, error } = await admin.from("name_change_requests").insert({
    person_id: person.id,
    previous_first_name: person.first_name,
    previous_last_name: person.last_name,
    requested_first_name: parsed.data.requestedFirstName,
    requested_last_name: parsed.data.requestedLastName,
    reason: parsed.data.reason,
    reason_notes: parsed.data.reasonNotes || null,
    status: "Pending",
  }).select("id").single();

  if (error) return NextResponse.json({ ok: false, reason: "Could not submit the name change request." }, { status: 500 });

  return NextResponse.json({ ok: true, id: created.id });
}
