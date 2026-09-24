// Update endpoint — Super Admin territory (users permission), separate
// from the plain read endpoint every signed-in person can hit.
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ warningSeconds: z.number().int().min(30).max(1800) });

export async function PUT(request: Request) {
  const admin = await requireAdmin(["users"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase.from("session_settings").select("id").limit(1).maybeSingle();

  const { error } = existing
    ? await supabase.from("session_settings").update({ warning_seconds_before_expiry: parsed.data.warningSeconds, updated_at: new Date().toISOString(), updated_by: admin.id }).eq("id", existing.id)
    : await supabase.from("session_settings").insert({ warning_seconds_before_expiry: parsed.data.warningSeconds, updated_by: admin.id });

  if (error) return NextResponse.json({ ok: false, reason: "Could not save the setting." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_updated_session_settings",
    target_table: "session_settings",
    details: { warning_seconds_before_expiry: parsed.data.warningSeconds },
  });

  return NextResponse.json({ ok: true });
}
