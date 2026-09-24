// Section 6: aggregates every pending-approval item across the system
// into one unified notification feed — computed live from the real
// tables each time, never duplicated into storage of its own (see
// migration 0026's comment for why). Each item type points to wherever
// an admin would actually go to review and act on it.

import { createClient } from "@/lib/supabase/server";

export interface PendingNotification {
  key: string; // stable id used for read-tracking, e.g. "profile:<uuid>"
  type: string;
  applicantName: string;
  submittedAt: string;
  href: string;
}

export async function getPendingNotifications(): Promise<PendingNotification[]> {
  const supabase = await createClient();
  const notifications: PendingNotification[] = [];

  const [profiles, licenseDocs, renewals, specialLicenses, nameChanges] = await Promise.all([
    supabase.from("people").select("id, first_name, last_name, updated_at").eq("profile_status", "Pending Review").order("updated_at", { ascending: false }).limit(20),
    supabase.from("license_documents").select("id, license_type, created_at, people:person_id(first_name, last_name)").eq("status", "Pending").order("created_at", { ascending: false }).limit(20),
    supabase.from("license_renewals").select("id, license_type, submitted_at, people:person_id(first_name, last_name)").in("status", ["Pending", "Under Review"]).order("submitted_at", { ascending: false }).limit(20),
    supabase.from("special_licenses").select("id, license_name, created_at, people:person_id(id, first_name, last_name)").eq("status", "Pending").eq("source", "self").order("created_at", { ascending: false }).limit(20),
    supabase.from("name_change_requests").select("id, requested_first_name, requested_last_name, submitted_at, people:person_id(first_name, last_name)").eq("status", "Pending").order("submitted_at", { ascending: false }).limit(20),
  ]);

  for (const p of profiles.data ?? []) {
    notifications.push({
      key: `profile:${p.id}`,
      type: "Profile Update",
      applicantName: `${p.first_name} ${p.last_name}`,
      submittedAt: p.updated_at,
      href: "/admin/register/pending",
    });
  }
  for (const d of licenseDocs.data ?? []) {
    const person = Array.isArray(d.people) ? d.people[0] : d.people;
    notifications.push({
      key: `license_document:${d.id}`,
      type: `${d.license_type} Licence Document`,
      applicantName: person ? `${person.first_name} ${person.last_name}` : "Unknown",
      submittedAt: d.created_at,
      href: "/admin/register/classify",
    });
  }
  for (const r of renewals.data ?? []) {
    const person = Array.isArray(r.people) ? r.people[0] : r.people;
    notifications.push({
      key: `renewal:${r.id}`,
      type: `${r.license_type} Licence Renewal`,
      applicantName: person ? `${person.first_name} ${person.last_name}` : "Unknown",
      submittedAt: r.submitted_at,
      href: "/admin/register/renewals",
    });
  }
  for (const s of specialLicenses.data ?? []) {
    const person = Array.isArray(s.people) ? s.people[0] : s.people;
    notifications.push({
      key: `special_license:${s.id}`,
      type: `Special Licence (${s.license_name})`,
      applicantName: person ? `${person.first_name} ${person.last_name}` : "Unknown",
      submittedAt: s.created_at,
      href: person ? `/admin/register/${(person as any).id ?? ""}` : "/admin/register",
    });
  }
  for (const n of nameChanges.data ?? []) {
    const person = Array.isArray(n.people) ? n.people[0] : n.people;
    notifications.push({
      key: `name_change:${n.id}`,
      type: "Name Change Request",
      applicantName: person ? `${person.first_name} ${person.last_name}` : "Unknown",
      submittedAt: n.submitted_at,
      href: "/admin/register/name-changes",
    });
  }

  return notifications.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}
