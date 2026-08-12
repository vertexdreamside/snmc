// Establishes the actual server-readable session after the magic-link
// verification. This exists because calling setSession() on the BROWSER
// Supabase client (lib/supabase/client.ts) writes the session via
// document.cookie, which did not reliably end up visible to the
// server-side cookie reading in middleware.ts / lib/auth/guards.ts in
// testing — a known category of gap with implicit-flow tokens in SSR
// apps. Writing the session here instead, through the SAME server client
// + cookies() pattern middleware already successfully reads, closes that
// gap by construction rather than by guessing at cookie attributes.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = createClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: parsed.data.access_token,
    refresh_token: parsed.data.refresh_token,
  });

  if (error || !data.session) {
    return NextResponse.json({ ok: false, reason: error?.message ?? "Could not establish session." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
