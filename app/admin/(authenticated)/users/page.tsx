import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersManager } from "./AdminUsersManager";
import Link from "next/link";

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin(["users"]);
  const supabase = createClient();

  const { data: users } = await supabase
    .from("admin_users")
    .select("id, full_name, role, phone, user_type, can_view_reports, can_manage_register, can_manage_elections, can_manage_admin_users, full_access, is_disabled, created_at")
    .eq("is_removed", false)
    .order("full_name");

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl text-council-navy">Admin Users</h1>
          <p className="font-body text-sm text-council-ink/60 mt-1">
            Add Council office staff or members and define exactly what each person can do. A secure setup link is
            generated for you to share with the new user directly — no email is sent automatically.
          </p>
        </div>
        <Link href="/admin/users/session-settings" className="font-body text-sm text-council-cyan underline whitespace-nowrap ml-4">
          Session Settings
        </Link>
      </div>
      <AdminUsersManager users={users ?? []} currentAdminId={currentAdmin.id} />
    </div>
  );
}
