// Single source of truth for what each admin role can see/do. Used by the
// sidebar (which links to show), the dashboard (which stat sections to
// show), and can be cross-checked against the requireAdmin([...]) calls in
// route handlers, which remain the actual enforcement point — this file
// is what the UI reads to stay honest about that enforcement, not a
// second, independent set of rules.
//
// This mapping is a reasonable default, not Council-confirmed — see the
// longer note in lib/auth/guards.ts.

import type { AdminRole } from "@/lib/types/database";

export function canManageRegister(role: AdminRole): boolean {
  return (["Super Admin", "Manager", "Supervisor", "Registration Officer"] as AdminRole[]).includes(role);
}

export function canManageElections(role: AdminRole): boolean {
  return (["Super Admin", "Manager", "Election Officer"] as AdminRole[]).includes(role);
}

export function isReportingOnly(role: AdminRole): boolean {
  return (["Minister", "Read Only"] as AdminRole[]).includes(role);
}

export function isSuperAdmin(role: AdminRole): boolean {
  return role === "Super Admin";
}
