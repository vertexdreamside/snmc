"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { NAV_GROUPS } from "./nav-items";

export function Topbar() {
  const pathname = usePathname();
  const current = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href.split("?")[0] === pathname);
  const title = current?.label ?? "Dashboard";

  return (
    <header className="h-[68px] shrink-0 bg-white border-b border-council-navy/10 px-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-lg text-council-navy leading-tight">{title}</h1>
        <p className="font-body text-xs text-council-ink/50 leading-tight">Seychelles Nurses & Midwives Council</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-council-cream rounded-card px-3 py-2 w-72">
          <Search size={16} className="text-council-ink/40" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search the register…"
            className="bg-transparent outline-none font-body text-sm w-full placeholder:text-council-ink/40"
          />
        </div>
        <button aria-label="Notifications" className="relative text-council-ink/50 hover:text-council-navy">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
