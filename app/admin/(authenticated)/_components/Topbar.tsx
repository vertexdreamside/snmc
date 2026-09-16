"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";
import { NAV_GROUPS } from "./nav-items";
import { LogoutButton } from "@/lib/components/LogoutButton";
import { useMobileSidebar } from "./MobileSidebarContext";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const current = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href.split("?")[0] === pathname);
  const title = current?.label ?? "Dashboard";
  const { setOpen } = useMobileSidebar();
  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notifications/count")
      .then((r) => r.json())
      .then((d) => d.ok && setUnreadCount(d.count))
      .catch(() => {});
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/admin/register?q=${encodeURIComponent(query.trim())}`);
  }

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
        <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 bg-council-cream rounded-card px-3 py-2 w-72">
          <button type="submit" aria-label="Search" className="text-council-ink/40 hover:text-council-navy shrink-0">
            <Search size={16} aria-hidden="true" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the register…"
            className="bg-transparent outline-none font-body text-sm w-full placeholder:text-council-ink/40"
          />
        </form>
        <Link href="/admin" aria-label="Notifications" className="relative text-council-ink/50 hover:text-council-navy">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-status-closed text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <LogoutButton redirectTo="/admin/login" className="flex items-center gap-1.5 text-sm text-council-ink/60 hover:text-council-navy" />
      </div>
    </header>
  );
}
