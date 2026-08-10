import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="bg-council-navyDeep text-white px-6 py-4 flex items-center justify-between">
        <nav className="flex gap-6 font-body text-sm">
          <span className="font-display">SNMC — Staff Portal</span>
          <Link href="/admin" className="hover:text-council-gold">
            Dashboard
          </Link>
          <Link href="/admin/register" className="hover:text-council-gold">
            Register
          </Link>
          <Link href="/admin/elections" className="hover:text-council-gold">
            Elections
          </Link>
          <Link href="/admin/reports" className="hover:text-council-gold">
            Reports
          </Link>
        </nav>
        <span className="font-body text-sm text-white/70">
          {admin.full_name} · {admin.role}
        </span>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
