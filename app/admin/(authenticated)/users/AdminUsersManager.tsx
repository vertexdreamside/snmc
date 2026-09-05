"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminActivityStatus } from "./AdminActivityStatus";

interface AdminUserRow {
  id: string;
  full_name: string | null;
  role: string | null;
  phone: string | null;
  user_type: "Admin" | "Councillor";
  can_view_reports: boolean;
  can_manage_register: boolean;
  can_manage_elections: boolean;
  can_manage_admin_users: boolean;
  full_access: boolean;
  is_disabled: boolean;
}

const PERMISSION_FIELDS = [
  { key: "can_view_reports", label: "Reports" },
  { key: "can_manage_register", label: "Register" },
  { key: "can_manage_elections", label: "Elections" },
  { key: "can_manage_admin_users", label: "Admin Users" },
] as const;

// Admin Users and Councillors are kept as two clearly separated lists
// (Sections 16-17) even though they share the exact same underlying
// account mechanism — same permission model, same secure invite-link
// creation, same disable/enable. Splitting the display is about
// clarity for whoever's managing these accounts, not a technical
// difference between the two account types.
export function AdminUsersManager({ users, currentAdminId }: { users: AdminUserRow[]; currentAdminId: string }) {
  const router = useRouter();
  const adminUsers = users.filter((u) => u.user_type === "Admin");
  const councillors = users.filter((u) => u.user_type === "Councillor");

  return (
    <div className="space-y-8">
      <AddUserForm onDone={() => router.refresh()} />

      <div>
        <h2 className="font-display text-base text-council-navy mb-3">Admin Users</h2>
        <UsersTable users={adminUsers} currentAdminId={currentAdminId} onChanged={() => router.refresh()} emptyMessage="No admin users yet." />
      </div>

      <div>
        <h2 className="font-display text-base text-council-navy mb-3">Councillors</h2>
        <UsersTable users={councillors} currentAdminId={currentAdminId} onChanged={() => router.refresh()} emptyMessage="No councillors added yet." />
      </div>

      <p className="font-body text-xs text-council-ink/40">
        "Title" is a free-text label only (e.g. "Election Officer," "Treasurer") — it doesn't grant access on its
        own. The checkboxes are what actually control what a person can do; define whichever combination fits
        them, or toggle Full Access for unrestricted control.
      </p>
    </div>
  );
}

function UsersTable({ users, currentAdminId, onChanged, emptyMessage }: { users: AdminUserRow[]; currentAdminId: string; onChanged: () => void; emptyMessage: string }) {
  return (
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
            <th className="px-4 py-3">Activity</th>
            <th className="px-4 py-3 w-40"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-council-navy/10">
          {users.map((u) => (
            <UserRow key={u.id} user={u} isSelf={u.id === currentAdminId} onChanged={onChanged} />
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-council-ink/50">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
    if (!confirm(`Remove access for ${user.full_name ?? "this user"}?`)) return;
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
    <tr className={user.is_disabled ? "bg-council-ink/5 opacity-60" : user.full_access ? "bg-council-cyan/5" : ""}>
      <td className="px-4 py-3">
        <div className="font-medium">
          {user.full_name ?? "—"} {isSelf && <span className="text-council-ink/40 text-xs">(you)</span>}
          {user.is_disabled && <span className="ml-2 text-status-closed text-xs font-medium">Disabled</span>}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== (user.role ?? "") && patchField("role", title)}
          placeholder="Title (optional)"
          className="mt-1 text-xs text-council-ink/60 border-b border-transparent hover:border-council-navy/20 focus:border-council-cyan outline-none bg-transparent w-full"
        />
        {user.phone && <p className="text-xs text-council-ink/40 mt-0.5">{user.phone}</p>}
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
        <AdminActivityStatus adminId={user.id} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1 items-start">
          <button onClick={handleResetPassword} disabled={busy !== null} className="text-council-navy text-xs font-body underline disabled:opacity-60">
            Reset Password
          </button>
          {!isSelf && (
            <button
              onClick={() => patchField("is_disabled", !user.is_disabled)}
              disabled={busy !== null}
              className={`text-xs font-body underline disabled:opacity-60 ${user.is_disabled ? "text-status-active" : "text-status-pending"}`}
            >
              {user.is_disabled ? "Enable Account" : "Disable Account"}
            </button>
          )}
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

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"Admin" | "Councillor">("Admin");
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
      body: JSON.stringify({ email, fullName, title, phone, userType, ...permissions }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage(`${email} has been sent a secure link to set up their account.`);
      setEmail("");
      setFullName("");
      setTitle("");
      setPhone("");
      setUserType("Admin");
      setPermissions({
        canViewReports: false,
        canManageRegister: false,
        canManageElections: false,
        canManageAdminUsers: false,
        fullAccess: false,
      });
      onDone();
    } else {
      setMessage(data.reason ?? "Could not add this user.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <h2 className="font-display text-base text-council-navy">+ Add New User</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="font-body text-xs text-council-ink/60 block mb-1">User Type</span>
          <select value={userType} onChange={(e) => setUserType(e.target.value as "Admin" | "Councillor")} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan">
            <option value="Admin">Admin</option>
            <option value="Councillor">Councillor</option>
          </select>
        </label>
        <div />
        <input
          type="text" required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <input
          type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <input
          type="tel" placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
        <input
          type="text" placeholder="Title (optional, e.g. Treasurer)" value={title} onChange={(e) => setTitle(e.target.value)}
          className="border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
      </div>

      <div>
        <p className="font-body text-xs text-council-ink/60 mb-2">
          Define this person's privileges — tick whichever combination fits, or grant Full Access for
          unrestricted control. You don't need to set or manage a password — they'll receive a secure link to
          set one up themselves.
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
        {busy ? "Adding…" : "+ Add New User"}
      </button>
      {message && <p className="font-body text-sm text-council-ink/60">{message}</p>}
    </form>
  );
}
