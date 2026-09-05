// Shown while the Councillor Portal is loading — the council layout
// itself does a server-side eligibility check before rendering, so this
// covers that wait as well as any page-level data fetch.
export default function CouncilLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-[60px] bg-council-navyDeep" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-card border border-council-navy/10 p-6">
            <div className="skeleton h-4 w-40 mb-4" />
            <div className="skeleton h-3 w-full mb-2" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
