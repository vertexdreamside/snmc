// Read-only, available to any signed-in user (not just admins) — the
// SessionExpiryWarning component runs on every portal, including the
// Nurse/Midwife side, and needs this value regardless of role.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("session_settings").select("warning_seconds_before_expiry").limit(1).maybeSingle();
  return NextResponse.json({ ok: true, warningSeconds: data?.warning_seconds_before_expiry ?? 120 });
}
