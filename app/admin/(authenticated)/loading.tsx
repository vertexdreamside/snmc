// Shown automatically by Next.js while any page inside the authenticated
// admin route group is loading server data. This ONLY replaces the
// {children} slot inside app/admin/(authenticated)/layout.tsx's <main> —
// the real sidebar and topbar from that layout stay mounted and visible
// throughout, since Next.js keeps a shared layout in place during
// navigation and only swaps out the page content itself.
//
// This file previously tried to rebuild an entire fake page shell of its
// own (a second sidebar-shaped div, a second header bar), on the
// mistaken assumption that loading.tsx replaces the whole page. Since
// the real layout's sidebar was ALREADY there the whole time, the result
// was a redundant solid-navy rectangle rendering inside the actual
// content area on every navigation — this is that "blue screen on
// click" bug, not a session/logout issue at all.
export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-6xl">
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
    </div>
  );
}
