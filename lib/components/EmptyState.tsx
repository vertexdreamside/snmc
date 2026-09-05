import Link from "next/link";
import { AlertCircle } from "lucide-react";

// Consistent "not found" / empty-state card used across nested detail
// pages (person, election, vote, nominate) — previously these were bare,
// unstyled text with no way back, inconsistent from page to page.
export function EmptyState({
  message,
  backHref,
  backLabel = "← Back",
}: {
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-card border border-council-navy/10 p-8 text-center">
      <AlertCircle size={28} className="text-council-ink/30 mx-auto mb-3" aria-hidden="true" />
      <p className="font-body text-sm text-council-ink/60 mb-4">{message}</p>
      {backHref && (
        <Link href={backHref} className="font-body text-sm text-council-navy underline">
          {backLabel}
        </Link>
      )}
    </div>
  );
}
