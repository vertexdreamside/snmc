// Creates a new election. This file previously had NO create handler at
// all — it contained a misplaced duplicate of the PATCH logic that
// actually belongs at .../elections/[id]/route.ts (which has its own,
// correct copy), meaning the "New Election" button silently failed on
// every attempt. Fixed here with a real POST handler.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const createSchema = z.object({
  termLabel: z.string().min(1, "Term label is required"),
  nominationDurationDays: z.number().int().min(1).max(90).default(14),
  votingDurationDays: z.number().int().min(1).max(90).default(7),
});

export async function POST(request: Request) {
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("elections")
    .insert({
      term_label: parsed.data.termLabel,
      status: "Planned",
      nomination_duration_days: parsed.data.nominationDurationDays,
      voting_duration_days: parsed.data.votingDurationDays,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, reason: "Could not create the election." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_created_election",
    target_table: "elections",
    target_id: data.id,
    details: { term_label: parsed.data.termLabel },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
