// Section 11: "If a user is automatically logged out because of genuine
// inactivity/session expiration, record: Reason: Session Expired."
// Called by SessionExpiryWarning.tsx at the moment it's about to force
// a logout due to the warning being ignored — using the session while
// it's still technically valid, since after signOut() there's nothing
// left to attribute this to.

import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/audit/getClientIp";
import { getDeviceInfo } from "@/lib/audit/getDeviceInfo";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true }); // already gone, nothing to log

  const service = createServiceRoleClient();
  const ipAddress = getClientIp(request);
  const device = getDeviceInfo(request);

  const [adminMatch, personMatch] = await Promise.all([
    service.from("admin_users").select("id").eq("auth_user_id", user.id).maybeSingle(),
    service.from("people").select("id").eq("auth_user_id", user.id).maybeSingle(),
  ]);

  const actorId = adminMatch.data?.id ?? personMatch.data?.id ?? null;
  const targetTable = adminMatch.data ? "admin_users" : "people";

  if (actorId) {
    await service.from("audit_log").insert({
      actor_id: actorId, action: "session_expired", target_table: targetTable, target_id: actorId,
      ip_address: ipAddress, device_type: device.deviceType, browser: device.browser, operating_system: device.os,
      details: { reason: "Session Expired" },
    });
  }

  return NextResponse.json({ ok: true });
}
