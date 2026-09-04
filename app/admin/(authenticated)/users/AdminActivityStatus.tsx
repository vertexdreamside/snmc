"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function AdminActivityStatus({ adminId }: { adminId: string }) {
  const [data, setData] = useState<{ status: "Active" | "Invited"; lastLoginAt: string | null } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${adminId}/activity`).then((r) => r.json()).then((d) => { if (d.ok) setData(d); });
  }, [adminId]);

  if (!data) return <span className="font-body text-xs text-council-ink/30">…</span>;

  return (
    <div className="font-body text-xs">
      {data.status === "Active" ? (
        <>
          <span className="text-status-active font-medium">Active</span>
          <p className="text-council-ink/50">{data.lastLoginAt ? `Last seen ${timeAgo(data.lastLoginAt)}` : ""}</p>
        </>
      ) : (
        <span className="text-status-pending font-medium">Invited — not yet signed in</span>
      )}
      <Link href={`/admin/audit-log?actor=${adminId}`} className="block text-council-cyan underline mt-0.5">View activity</Link>
    </div>
  );
}
