// Server-side Supabase client — used in Server Components, Route Handlers,
// and Server Actions. Reads/writes the session via Next.js cookies so RLS
// policies see the signed-in user, not the anonymous role.
//
// Rewritten to use the getAll/setAll cookie methods, which is Supabase's
// current documented pattern (supabase.com/docs/guides/auth/server-side/
// creating-a-client) — the previous version used individual get/set/remove
// methods, an older pattern a real @supabase/ssr GitHub issue (#110)
// specifically flags as capable of causing "random logouts, early session
// termination" — the exact symptom category this project has been stuck
// on: a session that appears to be set successfully but isn't recognized
// as valid on the very next request.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore when
          // middleware.ts is also refreshing the session.
        }
      },
    },
  });
}

// Service-role client — server-only, bypasses RLS. Use sparingly, e.g. for
// the data migration script and admin operations that must cross records
// RLS would otherwise scope to a single person. NEVER import this from
// client-facing code.
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
