// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Once the project is linked to a live Supabase instance, replace this file
// by running: npx supabase gen types typescript --linked > lib/types/database.ts

export type RegistrationStatus =
  | "Practising"
  | "Not Practising"
  | "Retired"
  | "Abroad"
  | "Deceased"
  | "Deleted"
  | "Unknown";

export type ProfessionalCategory = "Nurse" | "Midwife" | "Both";
export type ProfileStatus = "Approved" | "Pending Review" | "Rejected";
export type ServiceCategory = "Hospital" | "Community" | "Private" | "Unspecified";
export type AdminPermission = "reports" | "register" | "elections" | "users";
export type ElectionStatus =
  | "Planned"
  | "Nomination Open"
  | "Nomination Closed"
  | "Election Open"
  | "Election Closed"
  | "Completed";
export type CandidateStatus = "Nominated" | "Shortlisted" | "Elected" | "Not Elected";
export type AppointmentType = "Elected" | "Appointed";

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  sex: "M" | "F" | "Unknown" | null;
  date_of_birth: string | null;
  nin: string | null; // access-restricted — never select this column in a client-facing query
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  phone_home: string | null;
  phone_mobile: string | null;
  nurse_reg_no: string | null;
  midwife_reg_no: string | null;
  professional_category: ProfessionalCategory | null;
  training_institute: string | null;
  employer: string | null;
  place_of_work: string | null;
  employment_sector: "Government" | "Private" | null;
  service_category: ServiceCategory | null;
  nurse_license_no: string | null;
  nurse_license_expiry: string | null;
  nurse_license_renewed: string | null;
  midwife_license_no: string | null;
  midwife_license_expiry: string | null;
  midwife_license_renewed: string | null;
  registration_status: RegistrationStatus;
  is_active: boolean;
  category_confirmed: boolean;
  profile_status: ProfileStatus;
  data_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Fields safe to expose to the person themselves / other authenticated portals.
// NIN and admin-only notes are deliberately excluded — see Section 5 of the build spec.
export type PublicPerson = Omit<Person, "nin" | "notes">;

export interface Election {
  id: string;
  term_label: string;
  status: ElectionStatus;
  round1_open_at: string | null;
  round1_close_at: string | null;
  round2_open_at: string | null;
  round2_close_at: string | null;
  results_published: boolean;
}

export interface Candidate {
  id: string;
  election_id: string;
  person_id: string;
  category: "Nurse" | "Midwife";
  service_category: "Hospital" | "Community" | "Private" | null;
  nominated_by: string | null;
  round: number;
  status: CandidateStatus;
}

export interface CouncillorTerm {
  id: string;
  person_id: string;
  election_id: string | null;
  category: "Nurse" | "Midwife";
  appointment_type: AppointmentType;
  service_category: "Hospital" | "Community" | "Private" | null;
  term_start: string | null;
  term_end: string | null;
  is_active: boolean;
}

export interface AdminUser {
  id: string;
  auth_user_id: string;
  role: string; // free-text title/label only — see migration 0007
  full_name: string | null;
  can_view_reports: boolean;
  can_manage_register: boolean;
  can_manage_elections: boolean;
  can_manage_admin_users: boolean;
  full_access: boolean;
}
