import Image from "next/image";
import Link from "next/link";

// Landing page: a plain switchboard to the three portals (Section 1.1).
// No aggressive marketing copy — this is a utility for people who already
// know what they're here to do.
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <Image
          src="/snmc-emblem.png"
          alt="SNMC emblem"
          width={72}
          height={72}
          className="mx-auto mb-4"
          priority
        />
        <h1 className="font-display text-3xl md:text-4xl text-council-navy mb-2">
          Seychelles Nurses &amp; Midwives Council
        </h1>
        <p className="font-body text-council-ink/70 mb-10">Excellence in Practice · Safety in Care</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <PortalCard href="/portal/login" title="Nurse / Midwife Portal" desc="Vote, view or update your profile" />
          <PortalCard href="/council" title="Councillor Portal" desc="Council members" />
          <PortalCard href="/admin/login" title="Staff Portal" desc="Council office administration" />
        </div>
      </div>
    </main>
  );
}

function PortalCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-card border border-council-navy/10 p-6 text-left hover:border-council-gold transition-colors"
    >
      <h2 className="font-display text-lg text-council-navy mb-1">{title}</h2>
      <p className="font-body text-sm text-council-ink/60">{desc}</p>
    </Link>
  );
}
