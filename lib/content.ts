export const SITE = {
  name: "Sibert Residence",
  tagline: "La Digue · Seychelles",
  sloganEyebrow: "Welcome to Paradise",
  slogan: "Your Serene Hideaway in La Digue",
  phone: "+248 423 4142",
  phoneHref: "tel:+2484234142",
  whatsapp: "+248 266 9035",
  whatsappNumber: "2482669035",
  whatsappHref:
    "https://wa.me/2482669035?text=Hi%20Sibert%20Residence%2C%20I%27d%20like%20to%20know%20more%20about%20a%20stay.",
  email: "sibertresidence@seychelles.net",
  address: "La Passe, La Digue, Seychelles",
  mapsHref: "https://www.google.com/maps/search/?api=1&query=Sibert+Residence%2C+La+Passe%2C+La+Digue%2C+Seychelles",
  mapsEmbedSrc:
    "https://maps.google.com/maps?q=Sibert%20Residence%2C%20La%20Passe%2C%20La%20Digue%2C%20Seychelles&t=&z=17&ie=UTF8&iwloc=&output=embed",
  logoWhite: "/images/logo/sibert-logo-white.png",
  logoMark: "/images/logo/sibert-logo-white.png",
  social: {
    facebook: "https://www.facebook.com/share/1KKimtbTF",
    instagram: "https://www.instagram.com/sibertresidence/",
  },
};

export type SiteInfo = typeof SITE;

/**
 * Simple on/off switches for features the client may want to pause
 * temporarily without losing the work. To bring a feature back, flip its
 * flag back to `true` — nothing else needs to change.
 */
export const FEATURES = {
  /** The Rooms page's "Book Your Stay" panel — dates, room, guests, the
   *  live rate/season/terms preview, and the Check Availability button
   *  that opens the enquiry popup. Set to `false` to keep all of that
   *  information visible to guests while hiding the button that actually
   *  starts an enquiry from this panel (guests can still enquire via the
   *  homepage's Check Availability widget or WhatsApp). */
  roomBookingEnabled: false,
};

/** Build a wa.me link with a custom pre-filled message, using the site's WhatsApp number. */
export function whatsAppLink(site: SiteInfo, message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Restaurant & Bar", href: "/restaurant" },
  { label: "Souvenir Shop", href: "/shop" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Boat Excursion", href: "/services#boat" },
      { label: "Buggy Island Tour", href: "/services#buggy" },
      { label: "Bicycle Rental", href: "/services#bike" },
    ],
  },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/* ============================================================
   Exterior / homepage imagery
   ============================================================ */
export const EXTERIOR_IMAGES = {
  hero: "/images/exterior/drone-wide.jpg",
  heroSlides: [
    "/images/exterior/drone-wide.jpg",
    "/images/exterior/drone-coastline.jpg",
    "/images/exterior/drone-rooftops.jpg",
    "/images/exterior/street-view.jpg",
  ],
  story: "/images/exterior/entrance-close.jpg",
  about: "/images/exterior/street-view.jpg",
  cta: "/images/exterior/drone-canopy-1.jpg",
};

export type ExteriorImages = typeof EXTERIOR_IMAGES;

/* ============================================================
   Rooms + 2026/2027 rate card
   (source: Sibert Residence 2026-2027 Rates, valid 01 Nov 2026 – 31 Oct 2027)
   ============================================================ */
export type Room = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  bedding: string;
  occupancy: string;
  guestOptions: string[];
  highlights: string[];
  image: string;
  priceFrom: number;
};

export const ROOMS: Room[] = [
  {
    slug: "superior",
    name: "Superior Room",
    tagline: "Bright, breezy, and effortlessly comfortable.",
    description:
      "A sunlit retreat featuring a king size bed, coastal teal decor, and a private balcony with lush tropical views. Designed with cosy armchair seating and warm wooden finishes, it's the ideal space for couples or solo travellers to unwind after a day on the island.",
    bedding: "1 King Size Bed",
    occupancy: "Max 2 Adults, or 1 Adult + 1 Child (6–11 yrs)",
    guestOptions: ["2 Adults", "1 Adult + 1 Child (6–11 yrs)"],
    highlights: ["Private balcony", "Plush seating area", "Airy tile flooring"],
    image: "/images/rooms/superior.png",
    priceFrom: 186,
  },
  {
    slug: "deluxe",
    name: "Deluxe Room",
    tagline: "Expansive comfort with extra room to relax.",
    description:
      "Generously spaced to host couples or small families, the Deluxe Room features a main plush bed plus an extra single daybed. Comes fully appointed with a private ensuite bathroom, a full wooden wardrobe, and a dedicated vanity desk.",
    bedding: "1 King Bed + 1 Single Bed",
    occupancy: "Max 2 Adults + 1 Child (6–11 yrs), or 1 Adult + 2 Children (6–11 yrs)",
    guestOptions: ["2 Adults + 1 Child (6–11 yrs)", "1 Adult + 2 Children (6–11 yrs)"],
    highlights: ["Extra spacious layout", "Private ensuite bathroom", "Generous storage space"],
    image: "/images/rooms/deluxe.png",
    priceFrom: 201,
  },
];

export const PRICING = {
  currency: "€",
  validity: "1 November 2026 – 31 October 2027",
  note: "Rates are per room, per night, inclusive of breakfast, taxes and service charge — based on 2 adults sharing.",
  seasons: [
    {
      name: "Low Season",
      dates: "1–30 Sep 2026 · 1–20 Dec 2026 · 1 May – 30 Jun 2027",
    },
    {
      name: "High Season",
      dates: "1–30 Nov 2026 · 10 Jan – 20 Mar 2027 · 5–30 Apr 2027 · 1 Jul – 31 Aug 2027 · 1–31 Oct 2027",
    },
    {
      name: "Peak Season",
      dates: "21 Dec 2026 – 9 Jan 2027 · 21 Mar – 4 Apr 2027",
    },
  ],
  // Machine-readable version of the ranges above, used to determine which
  // season a selected date falls into (for rate lookup + minimum-stay rules).
  // Source: Sibert Residence 2026/2027 Rates, 2nd Edition (Seyvillas).
  seasonRanges: [
    { season: "low", start: "2026-09-01", end: "2026-09-30" },
    { season: "low", start: "2026-12-01", end: "2026-12-20" },
    { season: "low", start: "2027-05-01", end: "2027-06-30" },
    { season: "high", start: "2026-11-01", end: "2026-11-30" },
    { season: "high", start: "2027-01-10", end: "2027-03-20" },
    { season: "high", start: "2027-04-05", end: "2027-04-30" },
    { season: "high", start: "2027-07-01", end: "2027-08-31" },
    { season: "high", start: "2027-10-01", end: "2027-10-31" },
    { season: "peak", start: "2026-12-21", end: "2027-01-09" },
    { season: "peak", start: "2027-03-21", end: "2027-04-04" },
  ] as { season: "low" | "high" | "peak"; start: string; end: string }[],
  // Minimum nights required, by season. Peak is grouped with High per the
  // client's stay-length policy (Normal/Low: 2 nights, Peak/High: 3 nights).
  minStay: { low: 2, high: 2, peak: 3 } as Record<"low" | "high" | "peak", number>,
  rates: [
    { room: "Superior Room", low: 186, high: 205, peak: 240 },
    { room: "Deluxe Room", low: 201, high: 220, peak: 255 },
  ],
  extras: [
    "Half Board Supplement: €75 / night per adult (12+ yrs), €40 / night per child (6–11 yrs)",
    "Extra Bed Supplement: €50 / night (child 6–11 yrs only)",
    "Early Bird Offer: 10% off in High Season or 5% off in Low Season — book 60+ days ahead, B&B basis, minimum 3-night stay. Not combinable with other offers; not applicable to child-sharing bookings.",
    "Long Stay Offer: 15% off for stays of 7+ nights — High Season only, B&B basis. Not combinable with other offers; not applicable to child-sharing bookings.",
    "Christmas Eve Dinner Supplement (24 Dec, optional for B&B/HB guests): €90 per adult (12+ yrs), €45 per child (6–11 yrs)",
    "New Year's Eve Dinner Supplement (31 Dec, compulsory): B&B €105 per adult / €55 per child · Half Board €30 per adult / €15 per child",
    "Honeymooners receive a bottle of sparkling wine and a fruit platter (valid 6 months from wedding date)",
  ],
  occupancy:
    "Superior Room: max 2 adults, or 1 adult + 1 child (6–11 yrs). Deluxe Room: max 2 adults + 1 child (6–11 yrs), or 1 adult + 2 children (6–11 yrs). Base rate is for 2 adults.",
  prepayment: [
    "Low & High Seasons: 50% deposit due 7 days prior to arrival — remaining 50% balance due on check-in.",
    "Peak Season: 100% deposit due 21 days prior to arrival.",
  ],
  cancellation: [
    "High & Low Seasons: free cancellation 8+ days before arrival · 0–7 days: 50% charge · no-show/early departure: 100% charge",
    "Peak Season: free cancellation 22+ days before arrival · 0–21 days: 100% charge · no-show/early departure: 100% charge",
  ],
};

export type Pricing = typeof PRICING;

/* ============================================================
   FAQ — check-in/out, opening hours, policies
   ============================================================ */
export const FAQ = {
  checkIn: "12:00hrs",
  checkOut: "10:00hrs",
  checkInOutNote:
    "Early check-in and late check-out are subject to availability. To guarantee early check-in before 12:00hrs or late check-out until 15:00hrs, an extra charge of 50% of one night's accommodation applies.",
  restaurantHours: [
    { label: "Breakfast", time: "07:00hrs – 10:00hrs" },
    { label: "Lunch / Dinner", time: "11:00hrs – 21:00hrs (last order)" },
  ],
  items: [
    {
      question: "What time is check-in and check-out?",
      answer:
        "Check-in is from 12:00hrs and check-out is by 10:00hrs. Early check-in and late check-out are subject to availability — to guarantee early check-in before 12:00hrs or late check-out until 15:00hrs, an extra charge of 50% of one night's accommodation applies.",
    },
    {
      question: "What are the restaurant's opening hours?",
      answer: "Breakfast: 07:00hrs – 10:00hrs. Lunch & Dinner: 11:00hrs – 21:00hrs (last order).",
    },
    {
      question: "Is there a minimum stay?",
      answer:
        "Yes — Min Stay: 2 Nights (High & Low Seasons). Min Stay: 3 Nights (Peak Season). The applicable minimum is shown automatically once you select your dates.",
    },
    {
      question: "How much deposit do I need to pay to book?",
      answer:
        "For Low and High Season stays, a 50% deposit is due 7 days before arrival, with the remaining 50% balance paid on check-in. For Peak Season stays, a 100% deposit is due 21 days before arrival.",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "In High and Low Seasons, cancellations are free 8 or more days before arrival; 0–7 days before arrival incurs a 50% charge, and no-shows or early departures are charged in full. In Peak Season, cancellations are free 22 or more days before arrival; inside that window, or for no-shows and early departures, the full amount is charged.",
    },
    {
      question: "Do you offer half board?",
      answer: "Yes — a Half Board Supplement of €75 per night per adult (12+ yrs) and €40 per night per child (6–11 yrs) can be added to a B&B booking.",
    },
    {
      question: "Is there a discount for early bookings or long stays?",
      answer:
        "Yes — book 60 or more days ahead on a B&B basis (minimum 3 nights) for 10% off in High Season or 5% off in Low Season. Stays of 7 or more nights in High Season get 15% off on a B&B basis. These offers aren't combinable with each other and don't apply to child-sharing bookings.",
    },
  ],
};

export type Faq = typeof FAQ;

/* ============================================================
   Services
   ============================================================ */
export type ServiceItem = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
};

export const SERVICES: ServiceItem[] = [
  {
    id: "boat",
    name: "Boat Excursion",
    tagline: "Sail, snorkel and explore the coastline",
    description:
      "Head out onto the Indian Ocean in comfort and style — sailing past granite headlands, stopping to snorkel over reef and coral, and taking in La Digue's coastline from the water. A relaxed way to see the neighbouring islands and hidden coves that are hard to reach on foot.",
    highlights: ["Half-day & full-day options", "Snorkelling gear included", "Small group or private charter"],
    image: "/images/services/boat-excursion.jpg",
  },
  {
    id: "buggy",
    name: "Buggy Island Tour",
    tagline: "Explore La Digue in style",
    description:
      "An exciting buggy ride through scenic trails, past white-sand beaches and hidden island gems, for an unforgettable adventure. A great option for anyone who wants to see more of the island without pedalling every mile themselves.",
    highlights: ["Guided island route", "Stops at key viewpoints", "Great for groups & families"],
    image: "/images/services/buggy-sibert.jpg",
  },
  {
    id: "bike",
    name: "Bicycle Rental",
    tagline: "Two wheels, island pace",
    description:
      "La Digue is famously best explored by bike. Rent one directly from Sibert Residence and enjoy an eco-friendly ride to beaches, Creole villages, and coastal viewpoints — at your own pace, with no engine noise to interrupt the island quiet.",
    highlights: ["Daily & multi-day rental", "Well-maintained bikes", "Free route suggestions"],
    image: "https://sibert.sc/wp-content/uploads/2025/10/sibert-residence-c-8877.jpg",
  },
];

/* ============================================================
   Homepage gallery
   ============================================================ */
export const GALLERY_IMAGES = [
  "/images/exterior/drone-coastline.jpg",
  "/images/exterior/entrance-close.jpg",
  "/images/rooms/balcony.jpg",
  "/images/restaurant/dining-chandelier.jpg",
  "/images/shop/moonlight-sign.jpg",
  "/images/services/boat-excursion.jpg",
];

/* ============================================================
   Restaurant & Bar — real photos with short captions
   ============================================================ */
export type RestaurantPhoto = {
  title: string;
  description: string;
  image: string;
};

export const RESTAURANT_PHOTOS: RestaurantPhoto[] = [
  {
    title: "The Dining Room",
    description:
      "A hand-painted sunset mural wraps the ceiling of the dining room, giving every table an island backdrop, rain or shine.",
    image: "/images/restaurant/dining-room-wide.jpg",
  },
  {
    title: "Sunset Mural Ceiling",
    description:
      "Granite boulders, palm trees and a blazing Seychellois sunset — painted overhead, table to table.",
    image: "/images/restaurant/dining-chandelier.jpg",
  },
  {
    title: "The Bar",
    description:
      "A granite-top bar stocked with Seychellois rum, Takamaka spirits and the makings of a proper tropical cocktail.",
    image: "/images/restaurant/bar-counter.jpg",
  },
  {
    title: "Behind the Bar",
    description:
      "Local liqueurs and spirits lined up and ready — Tia Maria, Takamaka rum, Grand Marnier and more for the evening's cocktail list.",
    image: "/images/restaurant/bar-bottles.jpg",
  },
  {
    title: "Cocktail Bar Nook",
    description:
      "Tucked among the palms, our casual grill and juice bar serves fresh fruit juices, smoothies and cocktails through the day.",
    image: "/images/restaurant/cocktail-bar-terrace.jpg",
  },
  {
    title: "Welcome In",
    description:
      "Rum barrels dressed with fresh coconuts and hibiscus mark the entrance — a small taste of what's inside.",
    image: "/images/restaurant/entrance-barrels-1.jpg",
  },
];

/* ============================================================
   Souvenir Shop — Moonlight Craft Curios
   ============================================================ */
export const SHOP_CATEGORIES = [
  {
    name: "Woven & Hand-Made Crafts",
    description: "Palm-leaf weaving, baskets and coconut-shell pieces made by local artisans.",
    image: "/images/shop/shop-crafts-1.jpg",
  },
  {
    name: "Island Keepsakes",
    description: "Carved wood pieces, shell displays and small Creole artwork to remember La Digue by.",
    image: "/images/shop/shop-crafts-2.jpg",
  },
  {
    name: "Jewellery & Accessories",
    description: "Shell and bead jewellery, sun hats and bracelets handmade by local craftspeople.",
    image: "/images/shop/shop-crafts-3.jpg",
  },
];

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

/* ============================================================
   Availability — dates blocked per room, managed from the admin
   calendar. Empty by default (everything open) until an admin
   marks dates as unavailable.
   ============================================================ */
export const AVAILABILITY: { blockedDates: Record<string, string[]> } = {
  blockedDates: {
    superior: [],
    deluxe: [],
  },
};

export type Availability = typeof AVAILABILITY;
