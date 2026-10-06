import { requireAdmin } from "@/lib/auth/guards";
import { ExternalLink } from "lucide-react";

// In-platform copy of the Admin User Manual. Visible to every signed-in admin.
export default async function HelpPage() {
  await requireAdmin();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl text-council-navy">User Manual</h1>
          <p className="font-body text-sm text-council-ink/60 mt-1">Step-by-step help for every part of the admin platform. Use the search box on the left of the manual.</p>
        </div>
        <a
          href="/api/admin/manual"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-body text-sm text-council-cyan underline"
        >
          Open in a new tab <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      <iframe
        src="/api/admin/manual"
        title="SNMC Admin User Manual"
        className="w-full bg-white rounded-card border border-council-navy/10"
        style={{ height: "calc(100vh - 200px)", minHeight: 480 }}
      />
    </div>
  );
}
