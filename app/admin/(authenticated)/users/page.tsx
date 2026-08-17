import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersManager } from "./AdminUsersManager";

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin(["Super Admin"]);
  const supabase = createClient();

  const { data: users } = await supabase.from("admin_users").select("id, full_name, role").order("full_name");

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-xl text-council-navy">Admin Users</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Add Council office staff, Ministers, Supervisors, or Managers with role-scoped access. New users receive an
          email invitation to set up their sign-in.
        </p>
      </div>
      <AdminUsersManager users={users ?? []} currentAdminId={currentAdmin.id} />
    </div>
  );
}
