import { requireAdmin } from "@/lib/auth/guards";
import { DataExportClient } from "./DataExportClient";

// Admin-only. Matches the reference design's card-per-dataset export
// pattern — bulk whole-table exports, distinct from the customizable
// field-by-field report builder at /admin/reports.
export default async function DataExportPage() {
  await requireAdmin(["reports"]);
  return (
    <div className="max-w-4xl">
      <DataExportClient />
    </div>
  );
}
