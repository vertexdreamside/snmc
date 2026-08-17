"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = [
  "Super Admin",
  "Manager",
  "Supervisor",
  "Registration Officer",
  "Election Officer",
  "Minister",
  "Read Only",
] as const;

interface AdminUserRow {
  id: string;
  full_name: string | null;
  role: string;
}

export function AdminUsersManager({ users, currentAdminId }: { users: AdminUserRow[]; currentAdminId: string }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <InviteForm onDone={() => router.refresh()} />

      <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-council-cream text-council-ink/60 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 w-40"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-council-navy/10">
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === currentAdminId} onChanged={() => router.refresh()} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-council-ink/50">
                  No admin users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user, isSelf, onChanged }: { user: AdminUserRow; isSelf: boolean; onChanged: () => void }) {
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleRoleChange(newRole: string) {
    setRole(newRole);
    setBusy(true);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setBusy(false);
    onChanged();
  }

  async function handleRemove() {
    if (!confirm(`Remove admin access for ${user.full_name ?? "this user"}?`)) return;
    setBusy(true);
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  async function handleResetPassword() {
    setBusy(true);
    setResetMessage(null);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    setResetMessage(data.ok ? `Reset email sent to ${data.email}.` : data.reason ?? "Could not send reset email.");
  }

  return (
    <tr>
      <td className="px-4 py-3">
        {user.full_name ?? "—"} {isSelf && <span className="text-council-ink/40 text-xs">(you)</span>}
        {resetMessage && <p className="text-xs text-council-ink/50 mt-0.5">{resetMessage}</p>}
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={busy || isSelf}
          className="border border-council-navy/20 rounded-card px-2 py-1 font-body text-sm disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button onClick={handleResetPassword} disabled={busy} className="text-council-navy text-xs font-body underline disabled:opacity-60">
            Reset Password
          </button>
          {!isSelf && (
            <button onClick={handleRemove} disabled={busy} className="text-status-closed text-xs font-body underline disabled:opacity-60">
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("Read Only");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, role }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage(`Invitation sent to ${email}.`);
      setEmail("");
      setFullName("");
      onDone();
    } else {
      setMessage(data.reason ?? "Could not send invitation.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <h2 className="font-display text-base text-council-navy">Invite a new admin user</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          type="text"
          required
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60"
      >
        {busy ? "Sending invitation…" : "Send Invitation"}
      </button>
      {message && <p className="font-body text-sm text-council-ink/60">{message}</p>}
    </form>
  );
}
