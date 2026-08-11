import Image from "next/image";
import { requireCouncillor } from "@/lib/auth/guards";

// Councillor Portal shell (Section 4a). Default scope only — flagged in
// the build spec as needing Council confirmation before it grows further.
export default async function CouncilLayout({ children }: { children: React.ReactNode }) {
  const { person } = await requireCouncillor();

  return (
    <div className="min-h-screen">
      <header className="bg-council-navyDeep text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/snmc-emblem.png" alt="" width={28} height={28} aria-hidden="true" />
          <span className="font-display">SNMC — Council Portal</span>
        </div>
        <span className="font-body text-sm text-white/70">
          {person.first_name} {person.last_name}
        </span>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
