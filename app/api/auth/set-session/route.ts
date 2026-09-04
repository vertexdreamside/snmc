// Establishes the actual server-readable session after the magic-link
// verification. This exists because calling setSession() on the BROWSER
// Supabase client (lib/supabase/client.ts) writes the session via
// document.cookie, which did not reliably end up visible to the
// server-side cookie reading in middleware.ts / lib/auth/guards.ts.
//
// Two earlier versions of this route (one using next/headers cookies(),
// one using NextResponse.cookies.set() directly) both failed identically
// — proof the problem wasn't *how* cookies were attached to the response,
// but the cookie API shape itself. Both used the older per-cookie
// get/set/remove methods. Supabase's current documented pattern — and a
// real @supabase/ssr GitHub issue (#110) describing this exact symptom —
// point at getAll/setAll instead, which this version now uses,
// matching lib/supabase/server.ts and middleware.ts.

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

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: parsed.data.refresh_token,
  });

  console.log("SET-SESSION DEBUG", {
    hasError: !!error,
    errorMessage: error?.message,
    hasSession: !!data.session,
    userId: data.session?.user?.id,
    cookiesAttached: response.cookies.getAll().map((c) => c.name),
  });

  if (error || !data.session) {
    return NextResponse.json({ ok: false, reason: error?.message ?? "Could not establish session." }, { status: 400 });
  }

  return response;
}
