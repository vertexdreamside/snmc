import { requireAdmin } from "@/lib/auth/guards";
import { ReportBuilder } from "./ReportBuilder";
import Link from "next/link";

export default async function ReportsPage() {
  await requireAdmin(["reports"]);
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-sm text-council-ink/60">
          Choose which fields to include, optionally filter, then generate a report you can export.
        </p>
        <Link href="/admin/reports/elections" className="font-body text-sm text-council-cyan underline whitespace-nowrap ml-4">
          View Election Reports →
        </Link>
      </div>
      <ReportBuilder />
    </div>
  );
}
