// Single source of truth for what a given admin user can see/do. Used by
// the sidebar (which links to show) and the dashboard (which stat
// sections to show) — the actual enforcement point is requireAdmin() in
// route handlers/pages, which checks these same flags directly on the
// admin_users row; these helpers just let the UI stay consistent with
// that without duplicating the logic.
//
// Replaces an earlier fixed-role model (Super Admin/Manager/Supervisor/
// etc.) with real per-user permission flags, per explicit direction: the
// Council should be able to define exactly what a person can do, not
// just pick from a preset list. `role` is now a free-text title only —
// see migration 0007.

import type { AdminUser } from "@/lib/types/database";

export function canManageRegister(admin: Pick<AdminUser, "full_access" | "can_manage_register">): boolean {
  return admin.full_access || admin.can_manage_register;
}

export function canManageElections(admin: Pick<AdminUser, "full_access" | "can_manage_elections">): boolean {
  return admin.full_access || admin.can_manage_elections;
}

export function canViewReports(admin: Pick<AdminUser, "full_access" | "can_view_reports">): boolean {
  return admin.full_access || admin.can_view_reports;
}

export function canManageAdminUsers(admin: Pick<AdminUser, "full_access" | "can_manage_admin_users">): boolean {
  return admin.full_access || admin.can_manage_admin_users;
}

// A person whose only permission is viewing reports — used by the
// dashboard to decide whether to show read-only summary sections instead
// of nothing at all when they have no operational access.
export function isReportingOnly(
  admin: Pick<AdminUser, "full_access" | "can_view_reports" | "can_manage_register" | "can_manage_elections" | "can_manage_admin_users">
): boolean {
  return (
    !admin.full_access &&
    admin.can_view_reports &&
    !admin.can_manage_register &&
    !admin.can_manage_elections &&
    !admin.can_manage_admin_users
  );
}
