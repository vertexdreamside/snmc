// Route-guard middleware. Enforces the three-portal separation from Section
// 1.1 of the build spec: a Nurse/Midwife session must never reach /admin,
// an admin session must never reach /portal or /council as that role, etc.
//
// This checks *session presence and role*, not full authorization — RLS
// policies in Supabase remain the source of truth for data access. This
// layer exists to redirect people to the right login and to fail closed on
// obviously wrong combinations before a page even renders.
//
// Route groups: app/portal/(authenticated)/ and app/admin/(authenticated)/
// hold every page that requires a session; app/portal/login and
// app/admin/login sit outside those groups so their own layout never
// requires a session that logging in is meant to establish.
//
// Rewritten to use the getAll/setAll cookie pattern — see the comment in
// lib/supabase/server.ts for why the previous get/set/remove pattern was
// replaced.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isCouncilRoute = pathname.startsWith("/council");
  const isPortalRoute = pathname.startsWith("/portal") && pathname !== "/portal/login";

  if (!user && (isAdminRoute || isCouncilRoute || isPortalRoute)) {
    const loginPath = isAdminRoute ? "/admin/login" : "/portal/login";
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-specific checks happen server-side in each route group's layout
  // (see app/admin/(authenticated)/layout.tsx, app/council/layout.tsx)
  // because they need a database lookup (admin_users / councillor_terms)
  // that's cheap there but wasteful to repeat on every middleware
  // invocation.

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/council/:path*", "/admin/:path*"],
};
