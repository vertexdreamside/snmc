import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const createSchema = z.object({ termLabel: z.string().min(1) });

export async function POST(request: Request) {
  await requireAdmin(["Election Officer", "Manager", "Super Admin"]);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("elections")
    .insert({ term_label: parsed.data.termLabel, status: "Planned" })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, reason: "Could not create election." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
