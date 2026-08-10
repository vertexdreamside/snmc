import { requirePortalUser } from "@/lib/auth/guards";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const person = await requirePortalUser();

  return (
    <div className="min-h-screen">
      <header className="bg-council-navy text-white px-6 py-4 flex items-center justify-between">
        <span className="font-display">SNMC — Nurse / Midwife Portal</span>
        <span className="font-body text-sm text-white/70">
          {person.first_name} {person.last_name}
        </span>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
