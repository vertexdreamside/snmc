import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isLoginPath = pathname === "/admin/login";
  const isAdminPath = pathname.startsWith("/admin");

  // Supabase not configured yet: keep /admin locked rather than wide open.
  if (!url || !key) {
    if (isAdminPath && !isLoginPath) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminPath && !isLoginPath && !user) {
    const redirectUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // BUG FIX: this used to redirect away from /admin/login for ANY logged-in
  // Supabase user, not specifically an admin. A Nurse/Midwife (or
  // Councillor) signed in on the SAME browser — an ordinary thing to
  // happen, e.g. someone testing both portals, or a shared computer —
  // would get bounced from /admin/login to /admin, only to have the
  // dashboard's own requireAdmin() check correctly reject them (they're
  // not in admin_users) and send them right back to /admin/login, which
  // this middleware would then immediately bounce to /admin again —
  // an infinite redirect loop, with no error ever shown, just a blank
  // page and the server getting hammered with requests. Now it actually
  // checks admin_users (and is_disabled) before deciding the user
  // shouldn't see the login page.
  if (isLoginPath && user) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("is_disabled")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (admin && !admin.is_disabled) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
