// Bulk data export — whole-table pulls for the Data Export module, gated
// admin-only. Returns raw row data; the client builds the actual
// Excel/CSV file in-browser via SheetJS. Every export is logged: who,
// which dataset, when, how many rows.
//
// "Voting Results" here means AGGREGATE per-candidate tallies only —
// never who voted for whom. That anonymity boundary is enforced by the
// query itself (it only ever touches `ballots`, grouped by candidate,
// and never joins back to `vote_participation` or any voter identity),
// not just by convention.
//
// admin_users export deliberately excludes anything auth-related —
// title, permissions, and activity only, never emails/credentials.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { computeLicenseStatus } from "@/lib/reports";

const DATASETS = [
  "register",
  "nurses",
  "midwives",
  "licenses",
  "expired_licenses",
  "license_renewals",
  "special_licenses",
  "pending_approvals",
  "elections",
  "candidates",
  "voting_results",
  "councillors",
  "admin_users",
  "audit_log",
] as const;

const REGISTER_COLUMNS =
  "first_name, last_name, sex, nurse_reg_no, midwife_reg_no, professional_category, registration_status, profile_status, employment_sector, service_category, place_of_work, employer, training_institute, nurse_license_expiry, midwife_license_expiry, category_confirmed";

export async function GET(request: Request) {
  const actor = await requireAdmin(["reports"]);

  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset");
  if (!dataset || !(DATASETS as readonly string[]).includes(dataset)) {
    return NextResponse.json({ ok: false, reason: "Unknown dataset." }, { status: 400 });
  }

  const supabase = createClient();
  let rows: unknown[] = [];
  let targetTable = "people";

  switch (dataset) {
    case "register": {
      const { data, error } = await supabase.from("people").select(REGISTER_COLUMNS).order("last_name");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = data ?? [];
      break;
    }
    case "nurses": {
      const { data, error } = await supabase.from("people").select(REGISTER_COLUMNS).or("professional_category.eq.Nurse,professional_category.eq.Both").order("last_name");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = data ?? [];
      break;
    }
    case "midwives": {
      const { data, error } = await supabase.from("people").select(REGISTER_COLUMNS).or("professional_category.eq.Midwife,professional_category.eq.Both").order("last_name");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = data ?? [];
      break;
    }
    case "licenses": {
      const { data, error } = await supabase.from("people").select("first_name, last_name, nurse_reg_no, midwife_reg_no, nurse_license_no, nurse_license_expiry, midwife_license_no, midwife_license_expiry").order("last_name");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).map((p: any) => ({ ...p, license_status: computeLicenseStatus(p.nurse_license_expiry, p.midwife_license_expiry) }));
      break;
    }
    case "expired_licenses": {
      const { data, error } = await supabase.from("people").select("first_name, last_name, nurse_reg_no, midwife_reg_no, nurse_license_expiry, midwife_license_expiry").order("last_name");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).filter((p: any) => computeLicenseStatus(p.nurse_license_expiry, p.midwife_license_expiry) === "Expired");
      break;
    }
    case "license_renewals": {
      const { data, error } = await supabase.from("license_renewals").select("license_type, previous_expiry_date, requested_expiry_date, status, submitted_at, reviewed_at, review_comment, people:person_id(first_name, last_name)").order("submitted_at", { ascending: false });
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).map((r: any) => {
        const p = Array.isArray(r.people) ? r.people[0] : r.people;
        return { name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`, license_type: r.license_type, previous_expiry_date: r.previous_expiry_date, requested_expiry_date: r.requested_expiry_date, status: r.status, submitted_at: r.submitted_at, reviewed_at: r.reviewed_at, review_comment: r.review_comment };
      });
      targetTable = "license_renewals";
      break;
    }
    case "special_licenses": {
      const { data, error } = await supabase.from("special_licenses").select("license_name, license_number, issued_date, expiry_date, people:person_id(first_name, last_name)").order("issued_date", { ascending: false });
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).map((s: any) => {
        const p = Array.isArray(s.people) ? s.people[0] : s.people;
        return { name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`, license_name: s.license_name, license_number: s.license_number, issued_date: s.issued_date, expiry_date: s.expiry_date };
      });
      targetTable = "special_licenses";
      break;
    }
    case "pending_approvals": {
      const { data, error } = await supabase.from("people").select("first_name, last_name, nurse_reg_no, midwife_reg_no, profile_status, updated_at").eq("profile_status", "Pending Review").order("updated_at", { ascending: false });
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = data ?? [];
      break;
    }
    case "elections": {
      const { data, error } = await supabase.from("elections").select("term_label, status, results_published, live_results_visible, round1_close_at, round2_close_at").order("term_label", { ascending: false });
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = data ?? [];
      targetTable = "elections";
      break;
    }
    case "candidates": {
      const { data, error } = await supabase.from("candidates").select("category, service_category, round, status, nomination_count, current_placement_note, elections(term_label), people:person_id(first_name, last_name)").order("round");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).map((c: any) => {
        const p = Array.isArray(c.people) ? c.people[0] : c.people;
        const e = Array.isArray(c.elections) ? c.elections[0] : c.elections;
        return { term: e?.term_label ?? "", name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`, category: c.category, service_category: c.service_category, round: c.round, status: c.status, nomination_count: c.nomination_count, current_placement: c.current_placement_note };
      });
      targetTable = "candidates";
      break;
    }
    case "voting_results": {
      // Aggregate tallies ONLY — this query never touches vote_participation
      // or any voter identity, only ballots grouped by candidate.
      const { data: ballots, error } = await supabase.from("ballots").select("election_id, category, candidate_id, elections(term_label)");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      const tallyMap = new Map<string, { term: string; category: string; candidate_id: string; votes: number }>();
      for (const b of (ballots as any[]) ?? []) {
        const key = `${b.election_id}-${b.category}-${b.candidate_id}`;
        const e = Array.isArray(b.elections) ? b.elections[0] : b.elections;
        const existing = tallyMap.get(key);
        if (existing) existing.votes += 1;
        else tallyMap.set(key, { term: e?.term_label ?? "", category: b.category, candidate_id: b.candidate_id, votes: 1 });
      }
      const candidateIds = Array.from(new Set(Array.from(tallyMap.values()).map((t) => t.candidate_id)));
      const { data: candidateNames } = candidateIds.length
        ? await supabase.from("candidates").select("id, people:person_id(first_name, last_name)").in("id", candidateIds)
        : { data: [] };
      const nameMap = new Map<string, string>();
      for (const c of (candidateNames as any[]) ?? []) {
        const p = Array.isArray(c.people) ? c.people[0] : c.people;
        nameMap.set(c.id, `${p?.first_name ?? ""} ${p?.last_name ?? ""}`);
      }
      rows = Array.from(tallyMap.values())
        .map((t) => ({ term: t.term, category: t.category, candidate: nameMap.get(t.candidate_id) ?? "", votes: t.votes }))
        .sort((a, b) => b.votes - a.votes);
      targetTable = "ballots";
      break;
    }
    case "councillors": {
      const { data, error } = await supabase.from("councillor_terms").select("category, appointment_type, service_category, term_start, term_end, is_active, people:person_id(first_name, last_name)").order("term_start", { ascending: false });
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).map((t: any) => {
        const p = Array.isArray(t.people) ? t.people[0] : t.people;
        return { name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`, category: t.category, appointment_type: t.appointment_type, service_category: t.service_category, term_start: t.term_start, term_end: t.term_end, active: t.is_active };
      });
      targetTable = "councillor_terms";
      break;
    }
    case "admin_users": {
      // Title/permissions/activity only — never email, auth_user_id, or
      // anything credential-related.
      const { data, error } = await supabase.from("admin_users").select("full_name, role, can_view_reports, can_manage_register, can_manage_elections, can_manage_admin_users, full_access");
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = data ?? [];
      targetTable = "admin_users";
      break;
    }
    case "audit_log": {
      const { data, error } = await supabase.from("audit_log").select("action, target_table, target_id, ip_address, details, created_at").order("created_at", { ascending: false }).limit(5000);
      if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
      rows = (data ?? []).map((a: any) => ({ ...a, details: a.details ? JSON.stringify(a.details) : "" }));
      targetTable = "audit_log";
      break;
    }
  }

  const service = createServiceRoleClient();
  await service.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_exported_data",
    target_table: targetTable,
    details: { dataset, row_count: rows.length },
  });

  return NextResponse.json({ ok: true, rows });
}
