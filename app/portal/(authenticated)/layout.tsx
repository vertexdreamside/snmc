import Image from "next/image";
import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/guards";
import { LogoutButton } from "@/lib/components/LogoutButton";

// Forces this route (and everything nested under it) to render fresh on
// every single request, with zero caching at any layer — Vercel's edge,
// Next.js's Data/Full Route Cache, none of it. Added after seeing a
// request return a real 200 with only middleware's log line present and
// no log line from requirePortalUser() itself, which is only explainable
// if the page's actual server code never re-ran — i.e. a cached response
// being replayed. cookies() usage should already imply this automatically,
// but that inference didn't seem to be taking effect reliably here, so
// it's now stated explicitly rather than left implicit.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const person = await requirePortalUser();

  return (
    <div className="min-h-screen">
      <header className="bg-council-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/snmc-emblem.png" alt="" width={28} height={28} aria-hidden="true" />
            <div className="leading-tight">
              <span className="font-display block">SNMC — Nurse / Midwife Portal</span>
              <span className="font-body text-[10px] text-white/50 uppercase tracking-wide">Excellence in Practice &middot; Safety in Care</span>
            </div>
          </div>
          <nav className="hidden sm:flex gap-4 font-body text-sm text-white/70">
            <Link href="/portal" className="hover:text-white">
              Home
            </Link>
            <Link href="/portal/profile" className="hover:text-white">
              Profile
            </Link>
            <Link href="/portal/results" className="hover:text-white">
              Results
            </Link>
          </nav>
        </div>
        <span className="font-body text-sm text-white/70 flex items-center gap-4">
          {person.first_name} {person.last_name}
          <LogoutButton redirectTo="/portal/login" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white" />
        </span>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
