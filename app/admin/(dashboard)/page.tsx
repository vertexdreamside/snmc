import Link from "next/link";
import {
  Building2,
  BedDouble,
  Tag,
  Utensils,
  ShoppingBag,
  Sailboat,
  Images,
  HelpCircle,
  CalendarDays,
} from "lucide-react";

const CARDS = [
  { href: "/admin/site", label: "Site Info", desc: "Contact details, social links, logos", icon: Building2 },
  { href: "/admin/rooms", label: "Rooms", desc: "Room descriptions, photos, base prices", icon: BedDouble },
  { href: "/admin/pricing", label: "Pricing", desc: "Seasonal rates, deposits, offers", icon: Tag },
  { href: "/admin/availability", label: "Availability", desc: "Block dates per room on a calendar", icon: CalendarDays },
  { href: "/admin/restaurant", label: "Restaurant & Bar", desc: "Photos, captions, menu highlights", icon: Utensils },
  { href: "/admin/shop", label: "Souvenir Shop", desc: "Shop categories and photos", icon: ShoppingBag },
  { href: "/admin/services", label: "Services", desc: "Boat, buggy, and bike excursions", icon: Sailboat },
  { href: "/admin/gallery", label: "Gallery", desc: "Homepage photo gallery", icon: Images },
  { href: "/admin/faq", label: "FAQ", desc: "Check-in/out, hours, questions & answers", icon: HelpCircle },
];

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Welcome back</h1>
      <p className="text-sm text-[#3C4A41] mb-8">Pick a section to edit. Changes go live as soon as you save.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-xl border border-[#EDE3CE] p-5 hover:border-[#E3A857] hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#E7EFE9] text-[#0F3D2E] flex items-center justify-center mb-3">
              <c.icon size={18} />
            </div>
            <h3 className="font-medium text-[#16241C] text-sm">{c.label}</h3>
            <p className="text-xs text-[#8C8577] mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
