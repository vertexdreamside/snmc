"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Tag,
  Utensils,
  ShoppingBag,
  Sailboat,
  Images,
  HelpCircle,
  CalendarDays,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/site", label: "Site Info", icon: Building2 },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { href: "/admin/pricing", label: "Pricing", icon: Tag },
  { href: "/admin/availability", label: "Availability", icon: CalendarDays },
  { href: "/admin/restaurant", label: "Restaurant & Bar", icon: Utensils },
  { href: "/admin/shop", label: "Souvenir Shop", icon: ShoppingBag },
  { href: "/admin/services", label: "Services", icon: Sailboat },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
];

export default function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 overflow-y-auto py-4">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              active ? "bg-[#0F3D2E] text-white" : "text-[#3C4A41] hover:bg-[#E7EFE9]"
            }`}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F6F1E7] md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[#EDE3CE]">
        <div className="px-5 py-5 border-b border-[#EDE3CE]">
          <p className="font-semibold text-[#0F3D2E] text-sm">Sibert Residence</p>
          <p className="text-xs text-[#8C8577]">Admin panel</p>
        </div>
        <NavList />
        <div className="px-5 py-4 border-t border-[#EDE3CE]">
          <p className="text-xs text-[#8C8577] truncate mb-2">{userEmail}</p>
          <form action={signOutAction}>
            <button className="flex items-center gap-2 text-sm text-[#3C4A41] hover:text-[#0F3D2E]">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-[#EDE3CE] flex items-center justify-between px-4 py-3">
        <p className="font-semibold text-[#0F3D2E] text-sm">Sibert Residence Admin</p>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E7EFE9] text-[#0F3D2E]"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col">
            <div className="px-5 py-4 border-b border-[#EDE3CE] flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#0F3D2E] text-sm">Sibert Residence</p>
                <p className="text-xs text-[#8C8577]">Admin panel</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E7EFE9] text-[#0F3D2E]"
              >
                <X size={16} />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <div className="px-5 py-4 border-t border-[#EDE3CE]">
              <p className="text-xs text-[#8C8577] truncate mb-2">{userEmail}</p>
              <form action={signOutAction}>
                <button className="flex items-center gap-2 text-sm text-[#3C4A41]">
                  <LogOut size={15} /> Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
