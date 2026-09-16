// Section 13.2: "End the active session. Return the user to the login
// screen. Prevent access to the previous authenticated pages using the
// browser Back button without logging in again." This was never
// actually built anywhere in the app — there was no logout mechanism at
// all, on any portal. The "prevent Back button access" part is already
// covered structurally: every authenticated layout (portal, admin,
// council) is force-dynamic with no caching, so once the session is
// gone, hitting Back re-runs the server-side auth check and redirects
// to login rather than serving a stale cached page.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
