import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersManager } from "./AdminUsersManager";

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin(["users"]);
  const supabase = createClient();

  const { data: users } = await supabase
    .from("admin_users")
    .select("id, full_name, role, can_view_reports, can_manage_register, can_manage_elections, can_manage_admin_users, full_access")
    .order("full_name");

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-xl text-council-navy">Admin Users</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Add Council office staff or members and define exactly what each person can do. New users receive an
          email invitation to set up their sign-in.
        </p>
      </div>
      <AdminUsersManager users={users ?? []} currentAdminId={currentAdmin.id} />
    </div>
  );
}
