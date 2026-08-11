import { requireAdmin } from "@/lib/auth/guards";
import { ReportBuilder } from "./ReportBuilder";

export default async function ReportsPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <p className="font-body text-sm text-council-ink/60 mb-4">
        Choose which fields to include, optionally filter, then generate a report you can export.
      </p>
      <ReportBuilder />
    </div>
  );
}
