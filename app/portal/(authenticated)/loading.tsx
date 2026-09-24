// Shown while any page inside the Nurse/Midwife authenticated area is
// loading. This ONLY replaces the {children} slot inside
// app/portal/(authenticated)/layout.tsx's <div className="p-6"> — the
// real header from that layout stays mounted and visible throughout,
// since Next.js keeps a shared layout in place during navigation and
// only swaps out the page content itself. Previously rebuilt a second,
// fake header bar here on the mistaken assumption that loading.tsx
// replaces the whole page — since the real header was already there,
// that produced a redundant solid-navy block rendering inside the
// actual content area on every navigation (the same bug as the admin
// side's loading.tsx, fixed the same way).
export default function PortalLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <div className="skeleton h-4 w-32 mb-4" />
        <div className="skeleton h-3 w-full mb-2" />
        <div className="skeleton h-3 w-3/4" />
      </div>
    </div>
  );
}
