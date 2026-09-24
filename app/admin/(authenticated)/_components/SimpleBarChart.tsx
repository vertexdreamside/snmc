"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export function SimpleBarChart({ data, color = "#17AEE0" }: { data: { name: string; value: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Inter, sans-serif" }} />
        <YAxis tick={{ fontSize: 11, fontFamily: "Inter, sans-serif" }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
