import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ShieldQuestion,
  Vote,
  BarChart3,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { AdminRole } from "@/lib/types/database";

// `roles` is optional — omitted means every admin role can see the item
// (e.g. Dashboard, Reports). Where present, it's the same permission
// mapping documented in lib/auth/permissions.ts and enforced server-side
// in the matching route handler; this list is what makes the sidebar
// stop advertising pages/actions a given role can't actually use.
export const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; roles?: AdminRole[] }[];
}[] = [
  {
    label: "Main",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Register",
    items: [
      { href: "/admin/register", label: "Nurses & Midwives", icon: Users },
      { href: "/admin/register?status=Pending+Review", label: "Pending Approval", icon: ClipboardCheck },
      {
        href: "/admin/register/classify",
        label: "Confirm Categories",
        icon: ShieldQuestion,
        roles: ["Super Admin", "Manager", "Supervisor", "Registration Officer"],
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
        roles: ["Super Admin", "Manager", "Election Officer"],
      },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/admin/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, roles: ["Super Admin"] },
      { href: "/admin/users", label: "Admin Users", icon: ShieldCheck, roles: ["Super Admin"] },
    ],
  },
];
