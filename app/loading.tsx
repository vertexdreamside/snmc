// Shown while any page inside the Nurse/Midwife authenticated area is
// loading — shaped like the portal's header + card layout.
export default function PortalLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-[60px] bg-council-navy" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-card border border-council-navy/10 p-6">
          <div className="skeleton h-4 w-32 mb-4" />
          <div className="skeleton h-3 w-full mb-2" />
          <div className="skeleton h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}
