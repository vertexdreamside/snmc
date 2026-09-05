// Admin login itself is client-side (Staff Portal login calls Supabase's
// signInWithPassword directly from the browser) — this is the follow-up
// call the login page makes right after that resolves, so both outcomes
// land in the audit trail. On success, a real session now exists — read
// via the normal cookie-based client to resolve admin_users.id. On
// failure there's no session, so the attempted email is logged directly.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ outcome: z.enum(["success", "failure"]), email: z.string().email() });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const service = createServiceRoleClient();

  if (parsed.data.outcome === "failure") {
    await service.from("audit_log").insert({
      actor_id: null, action: "admin_login_failure", target_table: "admin_users",
      details: { attempted_email: parsed.data.email },
    });
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminId = user
    ? (await service.from("admin_users").select("id").eq("auth_user_id", user.id).maybeSingle()).data?.id ?? null
    : null;

  await service.from("audit_log").insert({
    actor_id: adminId, action: "admin_login_success", target_table: "admin_users",
    target_id: adminId, details: { email: parsed.data.email },
  });

  return NextResponse.json({ ok: true });
}
