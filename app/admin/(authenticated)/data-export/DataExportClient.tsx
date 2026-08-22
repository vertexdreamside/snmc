"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Users, Vote, Award, Download } from "lucide-react";

interface DatasetInfo {
  key: "register" | "candidates" | "councillors";
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const DATASETS: DatasetInfo[] = [
  {
    key: "register",
    label: "Nurses & Midwives Register",
    description: "Full register — registration numbers, category, status, employment details.",
    icon: Users,
    color: "#0B1F3A", // council-navy
  },
  {
    key: "candidates",
    label: "Election Candidates",
    description: "All nominated and shortlisted candidates across every election round.",
    icon: Vote,
    color: "#17AEE0", // council-cyan
  },
  {
    key: "councillors",
    label: "Councillor Terms",
    description: "Current and past Council terms — elected and appointed members.",
    icon: Award,
    color: "#060D1A", // council-navyDeep — three tonal shades of the same
    // brand family instead of an unrelated green/purple/cyan mix.
  },
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
          Download the system's live records as Excel or CSV. Files are generated in your browser — nothing is sent
          anywhere.
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
