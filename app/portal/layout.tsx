import Image from "next/image";
import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/guards";

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
