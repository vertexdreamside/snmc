"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  key: string;
  type: string;
  applicantName: string;
  submittedAt: string;
  href: string;
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

// Section 6: unread approval notifications, each clearly showing the
// applicant and request type, opening straight to where an admin would
// actually review it, with an explicit "mark read" action per item.
export function NotificationsPanel({ notifications, readKeys }: { notifications: NotificationItem[]; readKeys: string[] }) {
  const router = useRouter();
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set(readKeys));
  const [busy, setBusy] = useState<string | null>(null);

  async function markRead(key: string) {
    setBusy(key);
    await fetch("/api/admin/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setBusy(null);
    setLocallyRead((prev) => new Set(prev).add(key));
    router.refresh();
  }

  const unread = notifications.filter((n) => !locallyRead.has(n.key));

  if (unread.length === 0) return null;

  return (
    <div className="bg-white rounded-card border-2 border-council-cyan/40 p-4">
      <h3 className="font-display text-sm text-council-navy flex items-center gap-2 mb-3">
        <Bell size={16} className="text-council-cyan" aria-hidden="true" /> New Approvals ({unread.length})
      </h3>
      <ul className="space-y-2">
        {unread.slice(0, 10).map((n) => (
          <li key={n.key} className="flex items-center justify-between bg-council-cream rounded-card px-3 py-2">
            <Link href={n.href} onClick={() => markRead(n.key)} className="flex-1">
              <p className="font-body text-sm text-council-navy">
                <span className="font-medium">{n.applicantName}</span> — {n.type}
              </p>
              <p className="font-body text-xs text-council-ink/50">Submitted {timeAgo(n.submittedAt)}</p>
            </Link>
            <button
              onClick={() => markRead(n.key)}
              disabled={busy === n.key}
              className="text-council-ink/40 hover:text-status-active shrink-0 ml-3 disabled:opacity-40"
              title="Mark as read"
            >
              <Check size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
