"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { ALLOWED_REGISTER_FIELDS, AGE_GROUPS, LICENSE_STATUSES } from "@/lib/reports";

const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  sex: "Sex",
  nurse_reg_no: "Nurse Reg. No.",
  midwife_reg_no: "Midwife Reg. No.",
  professional_category: "Category",
  registration_status: "Registration Status",
  profile_status: "Profile Status",
  employment_sector: "Employment Sector",
  service_category: "Service Category",
  place_of_work: "Place of Work",
  employer: "Employer",
  training_institute: "Training Institute",
  nurse_license_expiry: "Nurse Licence Expiry",
  midwife_license_expiry: "Midwife Licence Expiry",
  age_group: "Age Group",
  license_status: "Licence Status",
};

const FIELD_OPTIONS = ALLOWED_REGISTER_FIELDS.map((key) => ({ key, label: FIELD_LABELS[key] ?? key }));
const DEFAULT_FIELDS = ["first_name", "last_name", "nurse_reg_no", "midwife_reg_no", "registration_status"];

// Fields with a natural, small set of discrete values get an inline
// sub-filter — checking the field's box doesn't just include the column,
// it also reveals "which of these values, specifically." Registration
// Status and Category deliberately DON'T get one here since the page
// already has top-level dropdowns for those — a second, field-level
// filter for the same thing would just be confusing duplication.
const SUB_FILTERS: Record<string, { param: string; options: string[] }> = {
  sex: { param: "sexFilter", options: ["M", "F", "Unknown"] },
  age_group: { param: "ageGroupFilter", options: AGE_GROUPS },
  employment_sector: { param: "employmentSectorFilter", options: ["Government", "Private"] },
  service_category: { param: "serviceCategoryFilter", options: ["Hospital", "Community", "Private", "Unspecified"] },
  profile_status: { param: "profileStatusFilter", options: ["Approved", "Pending Review", "Rejected"] },
  license_status: { param: "licenseStatusFilter", options: LICENSE_STATUSES },
};
const SUB_FILTER_VALUE_LABELS: Record<string, string> = { M: "Male", F: "Female" };

export function ReportBuilder() {
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_FIELDS));
  const [subFilters, setSubFilters] = useState<Record<string, Set<string>>>({});
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setSubFilters((sf) => {
          const { [key]: _, ...rest } = sf;
          return rest;
        });
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleSubFilterValue(fieldKey: string, value: string) {
    setSubFilters((prev) => {
      const current = new Set(prev[fieldKey] ?? []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [fieldKey]: current };
    });
  }

  async function generate() {
    if (selected.size === 0) return;
    setLoading(true);
    const params = new URLSearchParams({ fields: Array.from(selected).join(",") });
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    for (const [fieldKey, def] of Object.entries(SUB_FILTERS)) {
      const values = subFilters[fieldKey];
      if (values && values.size > 0 && values.size < def.options.length) {
        params.set(def.param, Array.from(values).join(","));
      }
    }
    const res = await fetch(`/api/admin/reports/register?${params.toString()}`);
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      setRows(data.rows);
      setFields(data.fields);
    }
  }

  function exportCsv() {
    if (!rows) return;
    const header = fields.map((f) => FIELD_OPTIONS.find((o) => o.key === f)?.label ?? f).join(",");
    const body = rows
      .map((row) => fields.map((f) => `"${String(row[f] ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snmc-register-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Real .xlsx generation (same library/pattern as the Data Export
  // module) rather than a CSV renamed to .xlsx — opens correctly in
  // Excel with proper column headers, not a plain-text file in disguise.
  function exportExcel() {
    if (!rows) return;
    const labeledRows = rows.map((row) => {
      const labeled: Record<string, string> = {};
      for (const f of fields) labeled[FIELD_OPTIONS.find((o) => o.key === f)?.label ?? f] = row[f] ?? "";
      return labeled;
    });
    const ws = XLSX.utils.json_to_sheet(labeledRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "snmc-register-report.xlsx");
  }

  // Uses the browser's own print dialog, which every browser can save
  // as a PDF — a dedicated PDF library isn't needed for a straightforward
  // tabular report, and this respects whatever page size/margins the
  // person printing actually wants.
  function printReport() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-base text-council-navy mb-3">Fields to include</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mb-4">
          {FIELD_OPTIONS.map((f) => (
            <div key={f.key}>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={selected.has(f.key)} onChange={() => toggle(f.key)} className="accent-council-navy" />
                {f.label}
              </label>
              {selected.has(f.key) && SUB_FILTERS[f.key] && (
                <div className="ml-6 mt-1 mb-2 flex flex-wrap gap-2">
                  {SUB_FILTERS[f.key]!.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-1 text-xs bg-council-cream rounded-card px-2 py-1 text-council-ink/70">
                      <input
                        type="checkbox"
                        checked={(subFilters[f.key] ?? new Set()).has(opt)}
                        onChange={() => toggleSubFilterValue(f.key, opt)}
                        className="accent-council-cyan w-3 h-3"
                      />
                      {SUB_FILTER_VALUE_LABELS[opt] ?? opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-council-navy/10 pt-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm">
            <option value="">All statuses</option>
            {["Practising", "Not Practising", "Retired", "Abroad", "Deceased", "Deleted", "Unknown"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm">
            <option value="">All categories</option>
            <option value="Nurse">Nurse</option>
            <option value="Midwife">Midwife</option>
            <option value="Both">Both</option>
          </select>
          <label className="flex items-center gap-1 font-body text-xs text-council-ink/60">
            Registered from
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-council-navy/20 rounded-card px-2 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-1 font-body text-xs text-council-ink/60">
            to
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-council-navy/20 rounded-card px-2 py-1.5 text-sm" />
          </label>
          <button onClick={generate} disabled={loading || selected.size === 0} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60">
            {loading ? "Generating…" : "Generate Report"}
          </button>
          {rows && (
            <>
              <button onClick={exportCsv} className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2">
                Export CSV
              </button>
              <button onClick={exportExcel} className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2">
                Export Excel
              </button>
              <button onClick={printReport} className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2">
                Print / PDF
              </button>
            </>
          )}
        </div>
      </div>

      {rows && (
        <div className="bg-white rounded-card border border-council-navy/10 overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead className="bg-council-cream text-council-ink/60 text-left">
              <tr>{fields.map((f) => (<th key={f} className="px-4 py-2 whitespace-nowrap">{FIELD_OPTIONS.find((o) => o.key === f)?.label ?? f}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-council-navy/10">
              {rows.map((row, i) => (
                <tr key={i}>{fields.map((f) => (<td key={f} className="px-4 py-2 whitespace-nowrap">{row[f] ?? "—"}</td>))}</tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={fields.length} className="px-4 py-8 text-center text-council-ink/50">No matching records.</td></tr>
              )}
            </tbody>
          </table>
          <p className="px-4 py-2 font-body text-xs text-council-ink/40">{rows.length} row(s)</p>
        </div>
      )}
    </div>
  );
}
