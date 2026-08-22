"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminUserRow {
  id: string;
  full_name: string | null;
  role: string | null;
  can_view_reports: boolean;
  can_manage_register: boolean;
  can_manage_elections: boolean;
  can_manage_admin_users: boolean;
  full_access: boolean;
}

const PERMISSION_FIELDS = [
  { key: "can_view_reports", label: "Reports" },
  { key: "can_manage_register", label: "Register" },
  { key: "can_manage_elections", label: "Elections" },
  { key: "can_manage_admin_users", label: "Admin Users" },
] as const;

export function AdminUsersManager({ users, currentAdminId }: { users: AdminUserRow[]; currentAdminId: string }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <InviteForm onDone={() => router.refresh()} />

      <div className="bg-white rounded-card border border-council-navy/10 overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-council-cream text-council-ink/60 text-left">
            <tr>
              <th className="px-4 py-3">Name / Title</th>
              {PERMISSION_FIELDS.map((f) => (
                <th key={f.key} className="px-3 py-3 text-center">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-3 text-center">Full Access</th>
              <th className="px-4 py-3 w-40"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-council-navy/10">
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === currentAdminId} onChanged={() => router.refresh()} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-council-ink/50">
                  No admin users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="font-body text-xs text-council-ink/40">
        "Title" is a free-text label only (e.g. "Election Officer," "Treasurer") — it doesn't grant access on its
        own. The checkboxes are what actually control what a person can do; define whichever combination fits
        them, or toggle Full Access for unrestricted control.
      </p>
    </div>
  );
}

function UserRow({ user, isSelf, onChanged }: { user: AdminUserRow; isSelf: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [title, setTitle] = useState(user.role ?? "");

  async function patchField(field: string, value: boolean | string) {
    setBusy(field);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    setBusy(null);
    onChanged();
  }

  async function handleRemove() {
    if (!confirm(`Remove admin access for ${user.full_name ?? "this user"}?`)) return;
    setBusy("remove");
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setBusy(null);
    onChanged();
  }

  async function handleResetPassword() {
    setBusy("reset");
    setResetMessage(null);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    setResetMessage(data.ok ? `Reset email sent to ${data.email}.` : data.reason ?? "Could not send reset email.");
  }

  return (
    <tr className={user.full_access ? "bg-council-cyan/5" : ""}>
      <td className="px-4 py-3">
        <div className="font-medium">
          {user.full_name ?? "—"} {isSelf && <span className="text-council-ink/40 text-xs">(you)</span>}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== (user.role ?? "") && patchField("role", title)}
          placeholder="Title (optional)"
          className="mt-1 text-xs text-council-ink/60 border-b border-transparent hover:border-council-navy/20 focus:border-council-cyan outline-none bg-transparent w-full"
        />
        {resetMessage && <p className="text-xs text-council-ink/50 mt-1">{resetMessage}</p>}
      </td>
      {PERMISSION_FIELDS.map((f) => (
        <td key={f.key} className="px-3 py-3 text-center">
          <input
            type="checkbox"
            checked={user[f.key]}
            disabled={busy !== null || user.full_access}
            onChange={(e) => patchField(f.key, e.target.checked)}
            className="accent-council-navy w-4 h-4"
          />
        </td>
      ))}
      <td className="px-3 py-3 text-center">
        <input
          type="checkbox"
          checked={user.full_access}
          disabled={busy !== null || isSelf}
          onChange={(e) => patchField("full_access", e.target.checked)}
          className="accent-council-cyan w-4 h-4"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1 items-start">
          <button onClick={handleResetPassword} disabled={busy !== null} className="text-council-navy text-xs font-body underline disabled:opacity-60">
            Reset Password
          </button>
          {!isSelf && (
            <button onClick={handleRemove} disabled={busy !== null} className="text-status-closed text-xs font-body underline disabled:opacity-60">
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
  const [title, setTitle] = useState("");
  const [permissions, setPermissions] = useState({
    canViewReports: false,
    canManageRegister: false,
    canManageElections: false,
    canManageAdminUsers: false,
    fullAccess: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function togglePermission(key: keyof typeof permissions) {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, title, ...permissions }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage(`Invitation sent to ${email}.`);
      setEmail("");
      setFullName("");
      setTitle("");
      setPermissions({
        canViewReports: false,
        canManageRegister: false,
        canManageElections: false,
        canManageAdminUsers: false,
        fullAccess: false,
      });
      onDone();
    } else {
      setMessage(data.reason ?? "Could not send invitation.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <h2 className="font-display text-base text-council-navy">Add a Council member</h2>
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
        <input
          type="text"
          placeholder="Title (optional, e.g. Treasurer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
      </div>

      <div>
        <p className="font-body text-xs text-council-ink/60 mb-2">
          Define this person's privileges — tick whichever combination fits, or grant Full Access for
          unrestricted control.
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={permissions.canViewReports} onChange={() => togglePermission("canViewReports")} disabled={permissions.fullAccess} className="accent-council-navy" />
            Reports
          </label>
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={permissions.canManageRegister} onChange={() => togglePermission("canManageRegister")} disabled={permissions.fullAccess} className="accent-council-navy" />
            Register
          </label>
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={permissions.canManageElections} onChange={() => togglePermission("canManageElections")} disabled={permissions.fullAccess} className="accent-council-navy" />
            Elections
          </label>
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={permissions.canManageAdminUsers} onChange={() => togglePermission("canManageAdminUsers")} disabled={permissions.fullAccess} className="accent-council-navy" />
            Admin Users
          </label>
          <label className="flex items-center gap-2 font-body text-sm font-medium text-council-navy">
            <input type="checkbox" checked={permissions.fullAccess} onChange={() => togglePermission("fullAccess")} className="accent-council-cyan" />
            Full Access
          </label>
        </div>
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
