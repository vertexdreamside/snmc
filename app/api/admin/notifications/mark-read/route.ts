import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ key: z.string().min(1) });

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("notification_reads")
    .upsert({ admin_id: admin.id, notification_key: parsed.data.key }, { onConflict: "admin_id,notification_key" });

  if (error) return NextResponse.json({ ok: false, reason: "Could not mark as read." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
