export default function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">{title}</h1>
      <div className="bg-white rounded-xl border border-[#EDE3CE] p-6 mt-6">
        <p className="text-sm text-[#3C4A41]">
          This editor isn&apos;t built yet — for now, update this section by editing{" "}
          <code className="bg-[#F6F1E7] px-1.5 py-0.5 rounded text-xs">lib/content.ts</code> (defaults) or the
          matching row in the <code className="bg-[#F6F1E7] px-1.5 py-0.5 rounded text-xs">site_content</code> table
          in Supabase directly.
        </p>
        {note && <p className="text-sm text-[#8C8577] mt-3">{note}</p>}
      </div>
    </div>
  );
}
