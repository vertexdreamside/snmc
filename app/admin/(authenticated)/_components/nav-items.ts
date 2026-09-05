import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ShieldQuestion,
  Vote,
  BarChart3,
  Database,
  ScrollText,
  ShieldCheck,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import type { AdminPermission } from "@/lib/types/database";

// `permissions` is optional — omitted means every signed-in admin can see
// the item (e.g. Dashboard). Where present, it's the same permission
// model enforced server-side in the matching route handler (see
// lib/auth/guards.ts's requireAdmin) — this list is what makes the
// sidebar stop advertising pages/actions a given person can't actually
// use, given a Super Admin can now grant any combination of these four
// flags per person rather than picking from a fixed role.
export const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; permissions?: AdminPermission[] }[];
}[] = [
  {
    label: "Main",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Register",
    items: [
      { href: "/admin/register", label: "Nurses & Midwives", icon: Users },
      { href: "/admin/register/pending", label: "Pending Approval", icon: ClipboardCheck, permissions: ["register"] },
      { href: "/admin/register/license-expiry", label: "Licence Expiry", icon: CalendarClock, permissions: ["register"] },
      { href: "/admin/register/renewals", label: "Licence Renewals", icon: RefreshCw, permissions: ["register"] },
      {
        href: "/admin/register/classify",
        label: "License Approval",
        icon: ShieldQuestion,
        permissions: ["register"],
      },
    ],
  },
  {
    label: "Elections",
    items: [
      {
        href: "/admin/elections",
        label: "Elections & Voting",
        icon: Vote,
        permissions: ["elections"],
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3, permissions: ["reports"] },
      { href: "/admin/data-export", label: "Data Export", icon: Database, permissions: ["reports"] },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, permissions: ["users"] },
      { href: "/admin/users", label: "Admin Users", icon: ShieldCheck, permissions: ["users"] },
    ],
  },
];
