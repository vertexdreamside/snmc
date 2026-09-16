"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { NAV_GROUPS } from "./nav-items";
import type { AdminPermission } from "@/lib/types/database";
import { useMobileSidebar } from "./MobileSidebarContext";

interface SidebarProps {
  fullName: string | null;
  role: string;
  fullAccess: boolean;
  permissions: Record<AdminPermission, boolean>;
}

export function Sidebar({ fullName, role, fullAccess, permissions }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { open, setOpen } = useMobileSidebar();

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permissions || fullAccess || item.permissions.some((p) => permissions[p])
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {/* Backdrop — mobile only, tapping it closes the drawer */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* On mobile this is a fixed-position off-canvas drawer, sliding in
          from the left over the content, closed by default. On desktop
          (md and up) it's back to the original inline, collapsible
          sidebar — the transform/position/fixed classes only apply below
          the md breakpoint. */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 shrink-0 bg-council-navyDeep text-white flex flex-col transition-transform duration-200 md:transition-all ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-[76px]" : "md:w-[264px]"} w-[264px]`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <Image src="/snmc-emblem.png" alt="SNMC" width={30} height={30} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-medium leading-tight truncate">SNMC</p>
              <p className="font-body text-[11px] text-white/50 leading-tight truncate">Staff Portal</p>
            </div>
          )}
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="md:hidden text-white/60 hover:text-white shrink-0">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-council-cyan/20 flex items-center justify-center text-council-cyanLight font-body text-xs font-medium shrink-0">
            {initials(fullName)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-body text-sm truncate">{fullName ?? "Staff"}</p>
              <p className="font-body text-[11px] text-white/50 truncate">{fullAccess ? "Full Access" : role}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="px-5 mb-1 font-body text-[10px] tracking-wide uppercase text-white/35">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href.split("?")[0];
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-5 py-2 font-body text-sm transition-colors ${
                      active
                        ? "bg-white/10 text-white border-l-2 border-council-cyan"
                        : "text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex items-center justify-center gap-2 px-5 py-4 border-t border-white/10 text-white/50 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}

function initials(name: string | null): string {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
