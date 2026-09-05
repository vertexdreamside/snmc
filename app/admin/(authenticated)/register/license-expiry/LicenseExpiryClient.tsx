"use client";

import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface Row {
  id: string;
  name: string;
  regNo: string;
  category: string;
  licenseType: string;
  expiryDate: string;
}

type Bucket = "Expired" | "7" | "30" | "60" | "90" | "Active";

const CARD_DEFS: { key: Bucket; label: string; icon: React.ElementType; color: string }[] = [
  { key: "Expired", label: "Expired", icon: AlertTriangle, color: "#8A2C2C" },
  { key: "7", label: "Expires in 7 Days", icon: AlertTriangle, color: "#8A2C2C" },
  { key: "30", label: "Expires in 30 Days", icon: Clock, color: "#B8860B" },
  { key: "60", label: "Expires in 60 Days", icon: Clock, color: "#B8860B" },
  { key: "90", label: "Expires in 90 Days", icon: Clock, color: "#17AEE0" },
  { key: "Active", label: "Active", icon: CheckCircle2, color: "#1E7D4F" },
];

function bucketFor(days: number): Bucket {
  if (days < 0) return "Expired";
  if (days <= 7) return "7";
  if (days <= 30) return "30";
  if (days <= 60) return "60";
  if (days <= 90) return "90";
  return "Active";
}

export function LicenseExpiryClient({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<Bucket | null>(null);
  const today = new Date();

  const withDays = rows.map((r) => ({
    ...r,
    days: Math.floor((new Date(r.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  }));
  const withBucket = withDays.map((r) => ({ ...r, bucket: bucketFor(r.days) }));

  const counts: Record<Bucket, number> = { Expired: 0, "7": 0, "30": 0, "60": 0, "90": 0, Active: 0 };
  for (const r of withBucket) counts[r.bucket]++;

  const visibleRows = selected ? withBucket.filter((r) => r.bucket === selected) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CARD_DEFS.map((card) => {
          const Icon = card.icon;
          const isActive = selected === card.key;
          return (
            <button
              key={card.key}
              onClick={() => setSelected(isActive ? null : card.key)}
              className={`text-left bg-white rounded-card border-2 p-4 transition-colors ${isActive ? "border-council-navy" : "border-council-navy/10 hover:border-council-cyan"}`}
            >
              <Icon size={20} style={{ color: card.color }} aria-hidden="true" />
              <p className="font-display text-2xl text-council-navy mt-2">{counts[card.key]}</p>
              <p className="font-body text-xs text-council-ink/60">{card.label}</p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
          <div className="p-4 border-b border-council-navy/10">
            <h2 className="font-display text-sm text-council-navy">{CARD_DEFS.find((c) => c.key === selected)?.label}</h2>
          </div>
          {visibleRows.length === 0 ? (
            <p className="font-body text-sm text-council-ink/40 p-6 text-center">None in this category.</p>
          ) : (
            <table className="w-full font-body text-sm">
              <thead className="bg-council-cream text-council-ink/60 text-left">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Reg. No.</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Licence Type</th>
                  <th className="px-4 py-2">Expiry Date</th>
                  <th className="px-4 py-2">Days Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-council-navy/10">
                {visibleRows
                  .sort((a, b) => a.days - b.days)
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2 text-council-ink/60">{r.regNo}</td>
                      <td className="px-4 py-2 text-council-ink/60">{r.category}</td>
                      <td className="px-4 py-2 text-council-ink/60">{r.licenseType}</td>
                      <td className="px-4 py-2 text-council-ink/60">{r.expiryDate}</td>
                      <td className="px-4 py-2 text-council-ink/60">{r.days < 0 ? `${Math.abs(r.days)} days ago` : `${r.days} days`}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
