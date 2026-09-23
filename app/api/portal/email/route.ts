// Self-service email update. Email lives in the separate people_emails
// table (people itself has no email column), so this is intentionally
// its own small endpoint rather than folded into the general profile
// update route's field-diff/approval flow. Applied immediately, not
// routed through admin approval like the other profile fields — a
// contact email is low-sensitivity and the person having a working way
// to be reached matters more than Council review of it, unlike NIN,
// name, or licence data.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

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

  const { data: existing } = await admin.from("people_emails").select("id").eq("person_id", person.id).maybeSingle();

  const { error } = existing
    ? await admin.from("people_emails").update({ email: parsed.data.email }).eq("id", existing.id)
    : await admin.from("people_emails").insert({ person_id: person.id, email: parsed.data.email });

  if (error) return NextResponse.json({ ok: false, reason: "Could not update your email address." }, { status: 500 });

  await admin.from("audit_log").insert({
    actor_id: person.id,
    action: "self_updated_email",
    target_table: "people_emails",
    target_id: person.id,
  });

  return NextResponse.json({ ok: true });
}
