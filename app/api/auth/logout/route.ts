// Section 13.2/11: "End the active session... Record the logout event in
// the Audit Log." Logout previously did neither the identity lookup nor
// any audit_log write at all — fixed here. The actor must be resolved
// and the row written BEFORE signOut() runs, since afterward there's no
// session left to identify who this even was.

import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/audit/getClientIp";
import { getDeviceInfo } from "@/lib/audit/getDeviceInfo";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const service = createServiceRoleClient();
    const ipAddress = getClientIp(request);
    const device = getDeviceInfo(request);

    // Could be either an admin_users row or a people row — check both,
    // since this one endpoint serves every portal.
    const [adminMatch, personMatch] = await Promise.all([
      service.from("admin_users").select("id").eq("auth_user_id", user.id).maybeSingle(),
      service.from("people").select("id").eq("auth_user_id", user.id).maybeSingle(),
    ]);

    if (adminMatch.data) {
      await service.from("audit_log").insert({
        actor_id: adminMatch.data.id, action: "admin_logout", target_table: "admin_users", target_id: adminMatch.data.id,
        ip_address: ipAddress, device_type: device.deviceType, browser: device.browser, operating_system: device.os,
      });
    } else if (personMatch.data) {
      await service.from("audit_log").insert({
        actor_id: personMatch.data.id, action: "portal_logout", target_table: "people", target_id: personMatch.data.id,
        ip_address: ipAddress, device_type: device.deviceType, browser: device.browser, operating_system: device.os,
      });
    }
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
