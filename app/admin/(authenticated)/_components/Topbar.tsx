"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { NAV_GROUPS } from "./nav-items";
import { LogoutButton } from "@/lib/components/LogoutButton";
import { useMobileSidebar } from "./MobileSidebarContext";

export function Topbar() {
  const pathname = usePathname();
  const current = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href.split("?")[0] === pathname);
  const title = current?.label ?? "Dashboard";
  const { setOpen } = useMobileSidebar();

  return (
    <header className="h-[68px] shrink-0 bg-white border-b border-council-navy/10 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="md:hidden text-council-ink/60 hover:text-council-navy shrink-0">
          <Menu size={22} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base sm:text-lg text-council-navy leading-tight truncate">{title}</h1>
          <p className="font-body text-xs text-council-ink/50 leading-tight truncate hidden sm:block">Seychelles Nurses & Midwives Council</p>
        </div>
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
        <LogoutButton redirectTo="/admin/login" className="flex items-center gap-1.5 text-sm text-council-ink/60 hover:text-council-navy" />
      </div>
    </header>
  );
}
