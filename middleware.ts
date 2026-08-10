// Route-guard middleware. Enforces the three-portal separation from Section
// 1.1 of the build spec: a Nurse/Midwife session must never reach /admin,
// an admin session must never reach /portal or /council as that role, etc.
//
// This checks *session presence and role*, not full authorization — RLS
// policies in Supabase remain the source of truth for data access. This
// layer exists to redirect people to the right login and to fail closed on
// obviously wrong combinations before a page even renders.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
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
  // (see app/admin/layout.tsx, app/council/layout.tsx) because they need a
  // database lookup (admin_users / councillor_terms) that's cheap there but
  // wasteful to repeat on every middleware invocation.

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/council/:path*", "/admin/:path*"],
};
