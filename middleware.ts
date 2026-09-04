// Route-guard middleware. Enforces the three-portal separation from
// Section 1.1 of the build spec: a Nurse/Midwife session must never
// reach /admin, an admin session must never reach /portal or /council,
// etc.
//
// /portal/login and /admin/login are hard-bypassed FIRST, before any
// cookie handling or auth check — confirmed via Vercel Runtime Logs
// (MIDDLEWARE-DIAG-V3 marker) that this is what actually resolved a
// self-redirect loop that was traced not to this file at all, but to the
// root layout (app/layout.tsx) briefly containing portal-only logic. The
// hard bypass is kept as a structural safeguard even though the root
// cause was elsewhere — belt and braces for the one thing that must
// never redirect to itself.
//
// Route groups: app/portal/(authenticated)/ and app/admin/(authenticated)/
// hold every page that requires a session; app/portal/login and
// app/admin/login sit outside those groups so their own layout never
// requires a session that logging in is meant to establish.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/portal/login" || pathname === "/admin/login") {
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
