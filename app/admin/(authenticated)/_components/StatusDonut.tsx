"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Colors drawn from the same navy/cyan family as the rest of the app,
// not ad-hoc hex values — the two active/positive-adjacent statuses use
// the brand cyan family, the two clearly-negative ones use the existing
// status-closed red already used for pills/errors elsewhere, and the
// two neutral ones use navy tints. This replaces an earlier version that
// pulled in unrelated colors (amber, blue, tan) with no connection to
// the site's actual palette.
const COLORS: Record<string, string> = {
  Practising: "#17AEE0", // council-cyan
  "Not Practising": "#5CC8ED", // council-cyanLight
  Retired: "#0B1F3A", // council-navy
  Abroad: "#7B8CA6", // muted navy tint
  Deceased: "#8A2C2C", // status-closed
  Deleted: "#B23B3B", // status-closed, lighter tint
  Unknown: "#C9CDD6", // neutral gray, deliberately the least saturated —
  // "Unknown" isn't a real category, it's a data-quality gap, so it
  // shouldn't visually compete with the actual statuses.
};

export function StatusDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#0B1F3A"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 12, fontFamily: "Inter, sans-serif" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
