// Establishes the actual server-readable session after the magic-link
// verification. This exists because calling setSession() on the BROWSER
// Supabase client (lib/supabase/client.ts) writes the session via
// document.cookie, which did not reliably end up visible to the
// server-side cookie reading in middleware.ts / lib/auth/guards.ts.
//
// A first version of this route wrote cookies via the next/headers
// cookies() API (the same helper lib/supabase/server.ts's createClient()
// uses for Server Components). That write did NOT reliably end up
// recognized by the very next request's server-side session check either
// — confirmed directly on video: this route completes, then the
// following GET /portal still 307-redirects back to login as if no
// session exists.
//
// This version instead builds the NextResponse object first and writes
// cookies directly onto it via response.cookies.set() — the exact same
// mechanism middleware.ts already uses successfully (proven: middleware
// correctly detects both signed-in and signed-out states across
// requests). Matching a working pattern exactly, rather than a second,
// superficially-similar one, is the actual fix here.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { z } from "zod";

const setSessionSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = setSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  // Build the response up front so cookie writes below attach directly
  // to it — same order-of-operations middleware.ts uses.
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined; // pure write path — no need to read existing cookies here
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: parsed.data.refresh_token,
  });

  if (error || !data.session) {
    return NextResponse.json({ ok: false, reason: error?.message ?? "Could not establish session." }, { status: 400 });
  }

  return response;
}
