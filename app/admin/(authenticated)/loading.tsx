// Shown automatically by Next.js while any page inside the authenticated
// admin route group is loading server data — shaped like the real
// dashboard (sidebar + stat card grid) so the layout doesn't jump when
// actual content arrives, rather than a blank flash or a generic spinner.
export default function AdminLoading() {
  return (
    <div className="min-h-screen flex bg-council-cream">
      <div className="w-[264px] shrink-0 bg-council-navyDeep" />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[68px] shrink-0 bg-white border-b border-council-navy/10" />
        <main className="flex-1 p-6 space-y-6 max-w-6xl">
          <div className="skeleton h-6 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-card border border-council-navy/10 p-5">
                <div className="skeleton w-11 h-11 rounded-full mb-4" />
                <div className="skeleton h-7 w-16 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-card border border-council-navy/10 p-6">
            <div className="skeleton h-4 w-48 mb-4" />
            <div className="skeleton h-48 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
}
