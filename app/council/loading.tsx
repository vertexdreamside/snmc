// Shown while the Councillor Portal is loading. This ONLY replaces the
// {children} slot inside app/council/layout.tsx's <div className="p-6"> —
// the real header from that layout stays mounted and visible throughout.
// Previously rebuilt a second, fake header bar here on the mistaken
// assumption that loading.tsx replaces the whole page (the same bug as
// the admin and portal loading.tsx files, fixed the same way).
export default function CouncilLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white rounded-card border border-council-navy/10 p-6">
          <div className="skeleton h-4 w-40 mb-4" />
          <div className="skeleton h-3 w-full mb-2" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
