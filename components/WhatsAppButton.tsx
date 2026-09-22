import type { SiteInfo } from "@/lib/content";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

export default function WhatsAppButton({ site }: { site: SiteInfo }) {
  if (!site.whatsappHref) return null;

  return (
    <a
      href={site.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${site.name} on WhatsApp`}
      className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_12px_28px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-110"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
