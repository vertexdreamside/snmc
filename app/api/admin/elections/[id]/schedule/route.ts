// Section 7: lets an admin manually configure the actual start/end
// date-time for each round in advance — separate from (and enforced
// independently of) the status-advance buttons elsewhere on this page.
// All schedule changes are recorded in the audit trail, per the
// explicit requirement that "all election and voting date/time changes
// must be recorded."

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  round1_open_at: z.string().nullable().optional(),
  round1_close_at: z.string().nullable().optional(),
  round2_open_at: z.string().nullable().optional(),
  round2_close_at: z.string().nullable().optional(),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from("elections")
    .select("round1_open_at, round1_close_at, round2_open_at, round2_close_at")
    .eq("id", params.id)
    .single();

  const update: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) update[key] = value ? new Date(value).toISOString() : null;
  }

  const { error } = await supabase.from("elections").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, reason: "Could not update the schedule." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_updated_election_schedule",
    target_table: "elections",
    target_id: params.id,
    details: { before, after: update },
  });

  return NextResponse.json({ ok: true });
}
