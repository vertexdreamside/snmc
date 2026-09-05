"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Users, Vote, Award, Download, FileText, Clock, RefreshCw, ClipboardCheck, ShieldCheck, ScrollText, BarChart3 } from "lucide-react";

type DatasetKey =
  | "register" | "nurses" | "midwives" | "licenses" | "expired_licenses" | "license_renewals"
  | "special_licenses" | "pending_approvals" | "elections" | "candidates" | "voting_results"
  | "councillors" | "admin_users" | "audit_log";

interface DatasetInfo {
  key: DatasetKey;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

// Tonal shades of the same navy/cyan brand family throughout — no
// unrelated rainbow of colors, matching the site-wide palette decision.
const DATASETS: DatasetInfo[] = [
  { key: "register", label: "Complete Register", description: "Every nurse and midwife — registration, category, status, employment.", icon: Users, color: "#0B1F3A" },
  { key: "nurses", label: "Nurse Database", description: "Register filtered to Nurse and Nurse/Midwife records only.", icon: Users, color: "#17AEE0" },
  { key: "midwives", label: "Midwife Database", description: "Register filtered to Midwife and Nurse/Midwife records only.", icon: Users, color: "#5CC8ED" },
  { key: "licenses", label: "Licence Database", description: "Every licence number, expiry date, and computed status.", icon: FileText, color: "#1B2074" },
  { key: "expired_licenses", label: "Expired Licence Database", description: "Only records with an already-expired licence.", icon: Clock, color: "#8A2C2C" },
  { key: "license_renewals", label: "Licence Renewal Database", description: "Every renewal request ever filed, approved or not.", icon: RefreshCw, color: "#14186B" },
  { key: "special_licenses", label: "Special Licences", description: "Additional certifications beyond base Nurse/Midwife registration.", icon: Award, color: "#B8860B" },
  { key: "pending_approvals", label: "Pending Approval Database", description: "Self-service edits currently awaiting Council review.", icon: ClipboardCheck, color: "#B8860B" },
  { key: "elections", label: "Election Database", description: "Every election created — status, dates, publication state.", icon: Vote, color: "#060D1A" },
  { key: "candidates", label: "Candidate Database", description: "All nominated, selected, and accepted candidates.", icon: Vote, color: "#17AEE0" },
  { key: "voting_results", label: "Voting Results", description: "Aggregate vote tallies per candidate — never individual voter choices.", icon: BarChart3, color: "#1E7D4F" },
  { key: "councillors", label: "Councillor Terms", description: "Current and past Council terms — elected and appointed members.", icon: Award, color: "#5F5E5A" },
  { key: "admin_users", label: "Admin/User Database", description: "Staff accounts — title and permissions only, never credentials.", icon: ShieldCheck, color: "#0B1F3A" },
  { key: "audit_log", label: "Audit Log", description: "Every recorded system action — the most recent 5,000 entries.", icon: ScrollText, color: "#8A2C2C" },
];

async function fetchDataset(key: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`/api/admin/data-export?dataset=${key}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.reason ?? "Export failed");
  return data.rows;
}

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

export function DataExportClient() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function loadCount(key: string) {
    if (counts[key] !== undefined) return;
    const rows = await fetchDataset(key);
    setCounts((prev) => ({ ...prev, [key]: rows.length }));
  }

  async function exportOne(key: string, format: "xlsx" | "csv") {
    setBusy(`${key}-${format}`);
    try {
      const rows = await fetchDataset(key);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, key.slice(0, 31));
      if (format === "csv") {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snmc-${key}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        download(wb, `snmc-${key}.xlsx`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function exportAll() {
    setBusy("all");
    try {
      const wb = XLSX.utils.book_new();
      for (const d of DATASETS) {
        const rows = await fetchDataset(d.key);
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, d.key.slice(0, 31));
      }
      download(wb, "snmc-export-all.xlsx");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-council-ink/60">
          Download the system's live records as Excel or CSV, independently or all at once. Files are generated
          in your browser — nothing is sent anywhere. Every export is recorded in the Audit Log.
        </p>
        <button
          onClick={exportAll}
          disabled={busy !== null}
          className="flex items-center gap-2 bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60 whitespace-nowrap"
        >
          <Download size={16} aria-hidden="true" />
          {busy === "all" ? "Exporting…" : "Export All (Excel)"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {DATASETS.map((d) => (
          <DatasetCard
            key={d.key}
            dataset={d}
            count={counts[d.key]}
            onReveal={() => loadCount(d.key)}
            onExport={(format) => exportOne(d.key, format)}
            busy={busy === `${d.key}-xlsx` || busy === `${d.key}-csv`}
          />
        ))}
      </div>
    </div>
  );
}

function DatasetCard({
  dataset,
  count,
  onReveal,
  onExport,
  busy,
}: {
  dataset: DatasetInfo;
  count: number | undefined;
  onReveal: () => void;
  onExport: (format: "xlsx" | "csv") => void;
  busy: boolean;
}) {
  const Icon = dataset.icon;
  return (
    <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden" onMouseEnter={onReveal}>
      <div className="p-4 text-white" style={{ backgroundColor: dataset.color }}>
        <div className="flex items-center justify-between">
          <Icon size={22} aria-hidden="true" />
        </div>
        <p className="font-body font-medium mt-2">{dataset.label}</p>
        <p className="font-body text-xs opacity-80">{count !== undefined ? `${count} records` : "—"}</p>
      </div>
      <div className="p-4">
        <p className="font-body text-xs text-council-ink/60 mb-3">{dataset.description}</p>
        <div className="flex gap-2">
          <button
            onClick={() => onExport("xlsx")}
            disabled={busy}
            className="flex-1 bg-council-navy text-white font-body text-xs font-medium rounded-card px-3 py-2 disabled:opacity-60"
          >
            Excel
          </button>
          <button
            onClick={() => onExport("csv")}
            disabled={busy}
            className="flex-1 border border-council-navy/20 font-body text-xs font-medium rounded-card px-3 py-2 disabled:opacity-60"
          >
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
