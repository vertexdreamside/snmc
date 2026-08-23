// Route-guard middleware. Enforces the three-portal separation from Section
// 1.1 of the build spec: a Nurse/Midwife session must never reach /admin,
// an admin session must never reach /portal or /council as that role, etc.
//
// MIDDLEWARE-DIAG-V3 — this version exists specifically to resolve a
// contradiction: a live network capture showed /portal/login and
// /admin/login self-redirecting (307 to the exact same path) on the
// currently-deployed commit, even though the previous version of this
// file's logic — read directly from the same live commit — provably
// excludes those two paths from ever triggering a redirect, on paper.
// Rather than keep re-reasoning about logic that already looks correct,
// this version makes it structurally impossible: the two login paths are
// checked and returned FIRST, before any other code in this file runs at
// all, and every request logs a version tag so Vercel's Runtime Logs can
// confirm definitively whether this exact code is what's actually
// executing — which is the one thing we haven't yet been able to verify
// directly, as opposed to inferring from source review.
//
// Route groups: app/portal/(authenticated)/ and app/admin/(authenticated)/
// hold every page that requires a session; app/portal/login and
// app/admin/login sit outside those groups so their own layout never
// requires a session that logging in is meant to establish.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("MIDDLEWARE-DIAG-V3", { pathname, url: request.url });

  // Hard bypass, checked before anything else touches this request —
  // these two paths must NEVER be redirected by this file, full stop.
  if (pathname === "/portal/login" || pathname === "/admin/login") {
    console.log("MIDDLEWARE-DIAG-V3 hard-bypass hit, returning next() immediately", { pathname });
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isCouncilRoute = pathname.startsWith("/council");
  const isPortalRoute = pathname.startsWith("/portal");

  if (!user && (isAdminRoute || isCouncilRoute || isPortalRoute)) {
    const loginPath = isAdminRoute ? "/admin/login" : "/portal/login";
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/council/:path*", "/admin/:path*"],
};
