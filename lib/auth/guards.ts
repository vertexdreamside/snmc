// Server-only helpers that turn "there is a session" into "this session is
// allowed in this portal." Each portal layout calls the matching guard and
// redirects on failure. Keeping this in one file makes the three-portal
// boundary auditable in one place rather than scattered across pages.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole, Person } from "@/lib/types/database";

export async function requirePortalUser(): Promise<Person> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: person, error } = await supabase
    .from("people")
    .select(
      "id, first_name, last_name, sex, date_of_birth, address_line1, address_line2, address_line3, phone_home, phone_mobile, nurse_reg_no, midwife_reg_no, professional_category, training_institute, employer, place_of_work, employment_sector, service_category, nurse_license_no, nurse_license_expiry, midwife_license_no, midwife_license_expiry, registration_status, is_active, profile_status, data_source, created_at, updated_at"
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

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, role, full_name")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !admin) redirect("/admin/login");
  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    redirect("/admin"); // signed in, just not permitted on this page
  }

  return admin;
}
