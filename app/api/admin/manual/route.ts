// Serves the Admin User Manual to signed-in administrators only. Kept out of
// /public on purpose: its screenshots show real register data, so it must not
// be reachable without an admin session.
import { requireAdmin } from "@/lib/auth/guards";
import { ADMIN_MANUAL_HTML } from "@/lib/manual/adminManual";

export async function GET() {
  await requireAdmin(); // any signed-in admin, no permission flag needed
  return new Response(ADMIN_MANUAL_HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
