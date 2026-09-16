import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { canManageRegister, isReportingOnly } from "@/lib/auth/permissions";
import { getPendingNotifications } from "@/lib/notifications/getPendingNotifications";

export async function GET() {
  const admin = await requireAdmin();
  const showRegister = canManageRegister(admin) || isReportingOnly(admin);
  if (!showRegister) return NextResponse.json({ ok: true, count: 0 });

  const supabase = createClient();
  const [notifications, readRows] = await Promise.all([
    getPendingNotifications(),
    supabase.from("notification_reads").select("notification_key").eq("admin_id", admin.id),
  ]);
  const readKeys = new Set((readRows.data ?? []).map((r) => r.notification_key));
  const unread = notifications.filter((n) => !readKeys.has(n.key)).length;

  return NextResponse.json({ ok: true, count: unread });
}
