import Image from "next/image";
import Link from "next/link";
import { Stethoscope, Users, ShieldCheck } from "lucide-react";
import { ContactFooter } from "@/lib/components/ContactFooter";

// Landing page: a plain switchboard to the three portals (Section 1.1).
// No aggressive marketing copy — this is a utility for people who already
// know what they're here to do. Header treatment (dark navy-to-black
// gradient band) matches the live SNMC website's hero style.
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="bg-council-header pt-16 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Image
            src="/snmc-emblem.png"
            alt="SNMC emblem"
            width={64}
            height={64}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
            Seychelles Nurses &amp; Midwives Council
          </h1>
          <p className="font-body text-council-cyanLight">Excellence in Practice · Safety in Care</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 pb-16 w-full">
        <div className="grid gap-4 sm:grid-cols-3">
          <PortalCard
            href="/portal/login"
            icon={Stethoscope}
            title="Nurse / Midwife Portal"
            desc="Vote, view or update your profile"
          />
          <PortalCard href="/council" icon={Users} title="Councillor Portal" desc="Council members" />
          <PortalCard href="/admin/login" icon={ShieldCheck} title="Staff Portal" desc="Council office administration" />
        </div>
      </div>

      <ContactFooter />
    </main>
  );
}

function PortalCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-card border border-council-navy/10 shadow-sm p-6 text-left hover:border-council-cyan transition-colors"
    >
      <Icon size={28} strokeWidth={1.75} className="text-council-cyan mb-3" aria-hidden="true" />
      <h2 className="font-display text-lg text-council-navy mb-1">{title}</h2>
      <p className="font-body text-sm text-council-ink/60">{desc}</p>
    </Link>
  );
}
