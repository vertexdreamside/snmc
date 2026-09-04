import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin(["users"]);
  const supabase = createClient();

  const { data: logins, count } = await supabase
    .from("audit_log")
    .select("created_at", { count: "exact" })
    .eq("actor_id", params.id)
    .eq("action", "admin_login_success")
    .order("created_at", { ascending: false })
    .limit(1);

  const lastLoginAt = logins && logins.length > 0 ? logins[0]!.created_at : null;

  return NextResponse.json({ ok: true, status: lastLoginAt ? "Active" : "Invited", lastLoginAt, loginCount: count ?? 0 });
}
