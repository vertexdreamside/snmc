"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  Practising: "#17AEE0",
  "Not Practising": "#B8860B",
  Retired: "#5F5E5A",
  Abroad: "#378ADD",
  Deceased: "#8A2C2C",
  Deleted: "#B4B2A9",
  Unknown: "#D4534B",
};

export function StatusDonut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#888"} />
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
