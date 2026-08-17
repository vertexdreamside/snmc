// Fallback loading UI for any route not covered by a more specific
// loading.tsx (e.g. /verify/[token]).
export default function RootLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-council-navy/20 border-t-council-navy rounded-full animate-spin" />
    </main>
  );
}
