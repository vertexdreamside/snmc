import { requireAdmin } from "@/lib/auth/guards";
import { Sidebar } from "./_components/Sidebar";
import { Topbar } from "./_components/Topbar";

// See the matching comment in app/portal/(authenticated)/layout.tsx —
// forces fresh rendering with zero caching, added while ruling out a
// cached-response theory for a persistent session bug.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen flex bg-council-cream">
      <Sidebar
        fullName={admin.full_name}
        role={admin.role}
        fullAccess={admin.full_access}
        permissions={{
          reports: admin.can_view_reports,
          register: admin.can_manage_register,
          elections: admin.can_manage_elections,
          users: admin.can_manage_admin_users,
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
