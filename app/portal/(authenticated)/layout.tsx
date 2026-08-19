import Image from "next/image";
import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/guards";

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
            <span className="font-display">SNMC — Nurse / Midwife Portal</span>
          </div>
          <nav className="hidden sm:flex gap-4 font-body text-sm text-white/70">
            <Link href="/portal" className="hover:text-white">
              Home
            </Link>
            <Link href="/portal/profile" className="hover:text-white">
              Profile
            </Link>
          </nav>
        </div>
        <span className="font-body text-sm text-white/70">
          {person.first_name} {person.last_name}
        </span>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
