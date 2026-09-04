// Server-only helpers that turn "there is a session" into "this session is
// allowed in this portal." Each portal layout calls the matching guard and
// redirects on failure. Keeping this in one file makes the three-portal
// boundary auditable in one place rather than scattered across pages.
//
// Admin access is permission-based, not role-based (see migration 0007 and
// lib/auth/permissions.ts) — the Council defines exactly what a given
// person can do via four independent flags (reports/register/elections/
// users) plus a full_access override, rather than picking from a fixed
// list of preset roles. `role` on admin_users is a free-text title only,
// shown in the UI, and carries no access-control meaning.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminPermission, Person } from "@/lib/types/database";

export async function requirePortalUser(): Promise<Person> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: person, error } = await supabase
    .from("people")
    .select(
      "id, first_name, last_name, sex, date_of_birth, address_line1, address_line2, address_line3, phone_home, phone_mobile, nurse_reg_no, midwife_reg_no, professional_category, training_institute, employer, place_of_work, employment_sector, service_category, nurse_license_no, nurse_license_expiry, midwife_license_no, midwife_license_expiry, registration_status, is_active, is_deceased, profile_status, category_confirmed, data_source, created_at, updated_at"
    )
    .eq("auth_user_id", user.id)
    .single();

  if (error || !person) redirect("/portal/login");
  return person as Person;
}

export async function requireCouncillor(): Promise<{ person: Person; termId: string }> {
  const person = await requirePortalUser();
  const supabase = createClient();

  const { data: term } = await supabase
    .from("councillor_terms")
    .select("id")
    .eq("person_id", person.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!term) {
    // Signed in as a Nurse/Midwife, but not a current Councillor —
    // send them to the portal they do have access to, not an error page.
    redirect("/portal");
  }

  return { person, termId: term.id };
}

const PERMISSION_COLUMN: Record<AdminPermission, string> = {
  reports: "can_view_reports",
  register: "can_manage_register",
  elections: "can_manage_elections",
  users: "can_manage_admin_users",
};

const ADMIN_SELECT =
  "id, auth_user_id, role, full_name, can_view_reports, can_manage_register, can_manage_elections, can_manage_admin_users, full_access";

// `required` lists which permissions would grant access — any one of them
// is enough (OR semantics), same as the old role-list model. Omit it
// entirely for pages any signed-in admin may view (e.g. a read-only
// detail page), and gate the actual write actions on that page's own API
// route calls to requireAdmin([...]) instead.
export async function requireAdmin(required?: AdminPermission[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin, error } = await supabase.from("admin_users").select(ADMIN_SELECT).eq("auth_user_id", user.id).single();

  if (error || !admin) redirect("/admin/login");

  if (required && required.length > 0 && !admin.full_access) {
    const hasAny = required.some((p) => admin[PERMISSION_COLUMN[p] as keyof typeof admin] === true);
    if (!hasAny) redirect("/admin"); // signed in, just not permitted on this page
  }

  return admin;
}
