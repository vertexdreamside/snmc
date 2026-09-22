import Link from "next/link";
import Reveal from "@/components/Reveal";
import Boulder from "@/components/Boulder";
import SectionHead from "@/components/SectionHead";
import FrondDivider from "@/components/FrondDivider";
import RoomCard from "@/components/RoomCard";
import HeroCarousel from "@/components/HeroCarousel";
import { BookingWidgetCompact } from "@/components/BookingForm";
import { getExteriorImages, getGalleryImages, getRooms, getAvailability, getPricing, getSite } from "@/lib/cms";

export default async function HomePage() {
  const [exteriorImages, galleryImages, rooms, availability, pricing, site] = await Promise.all([
    getExteriorImages(),
    getGalleryImages(),
    getRooms(),
    getAvailability(),
    getPricing(),
    getSite(),
  ]);

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative min-h-screen flex items-end pt-40 pb-36 sm:pb-40 overflow-hidden">
        <HeroCarousel images={exteriorImages.heroSlides} alt="Sibert Residence, La Digue" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a231a]/35 via-[#0a231a]/25 to-[#091a13]/92 z-[1]" />
        <div className="relative z-[2] max-w-[1180px] mx-auto px-5 sm:px-8 pb-24 w-full">
          <span className="font-script text-3xl md:text-4xl text-gold block leading-none mb-1">
            Bonzour &amp; welcome
          </span>
          <h1
            className="font-display font-medium text-white text-4xl md:text-7xl max-w-[14ch]"
            style={{ textShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
          >
            A cosy island home, five minutes from the jetty
          </h1>
          <p className="font-display italic text-gold text-lg md:text-xl mt-3">{site.slogan}</p>
          <p className="text-sand/90 max-w-[44ch] mt-4 text-lg">
            Sibert Residence is a family-run guest house on La Passe beach, La Digue — relaxed rooms, Creole
            cooking, a cocktail bar and easy access to the island&apos;s beaches, boulders and back roads.
          </p>
        </div>
        <span className="hidden md:flex absolute right-10 bottom-9 z-[2] text-sand items-center gap-2.5 text-xs tracking-[0.3em] uppercase opacity-85 [writing-mode:vertical-rl]">
          Scroll
        </span>
      </section>

      {/* ===== Booking widget ===== */}
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
        <BookingWidgetCompact availability={availability} pricing={pricing} site={site} rooms={rooms} />
      </div>

      {/* ===== About ===== */}
      <section className="py-28">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <Boulder
              src={exteriorImages.story}
              alt="Sibert Residence guest house exterior on La Digue"
              aspect="aspect-[4/4.6]"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <span className="font-script text-3xl text-gold-deep block leading-none mb-1">Our story</span>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-green-deep">
              Twenty years of island hospitality, just steps from La Passe beach
            </h2>
            <p className="text-ink-soft mt-4">
              Tucked in La Passe on La Digue, Sibert Residence sits a short, easy ride from the jetty — close
              enough to arrive with your bags still swinging, far enough to feel like a proper island escape.
              Bikes lean against the veranda, the restaurant smells of coconut and grilled fish, and the granite
              boulders that make this island famous are never far from view.
            </p>
            <p className="text-ink-soft mt-3">
              For over two decades our family has welcomed travellers into cosy, breezy rooms and looked after
              them the Seychellois way — with warmth, patience, and a genuine love for this small corner of
              paradise.
            </p>
            <div className="flex gap-8 mt-8 flex-wrap">
              {[
                ["20+", "Years of hospitality"],
                ["10", "Rooms"],
                ["5 min", "Ride from the jetty"],
              ].map(([n, label]) => (
                <div key={label} className="border-l-2 border-gold pl-3.5">
                  <strong className="block font-display text-3xl text-green-deep">{n}</strong>
                  <span className="text-sm text-ink-soft">{label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Rooms teaser ===== */}
      <section className="py-28 bg-green-pale">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHead
              center
              eyebrow="Where you'll sleep"
              title="Discover Our Rooms"
              description="Ten rooms across two styles — from sunlit balconies to extra space for families. All are just steps from the restaurant, the bar, and the beach path."
            />
          </Reveal>
          <div className="grid md:grid-cols-2 gap-10 items-stretch">
            {rooms.map((room, i) => (
              <Reveal key={room.slug} delay={i * 0.1} className="h-full">
                <RoomCard room={room} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Feature strip ===== */}
      <section className="py-28 bg-green-deep text-sand">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHead
              dark
              eyebrow="At Sibert Residence"
              title="Everything you need for an easy island stay"
              description="Creole cooking, tropical cocktails, hand-made souvenirs and island adventures — all a short walk from your room."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid md:grid-cols-3 border-t border-white/15">
              {[
                {
                  n: "01",
                  title: "Nature's Choice A'LaKart Restaurant & Bar",
                  body: "Authentic Creole flavours made with fresh, local ingredients, plus tropical cocktails at our bar.",
                  href: "/restaurant",
                  label: "Visit restaurant",
                },
                {
                  n: "02",
                  title: "Moonlight Craft Curios",
                  body: "Hand-made Creole crafts and keepsakes to take a piece of La Digue home with you.",
                  href: "/shop",
                  label: "Browse the shop",
                },
                {
                  n: "03",
                  title: "Boat, Buggy & Bike",
                  body: "Sail the coastline, tour the island by buggy, or pedal to the beaches at your own pace.",
                  href: "/services",
                  label: "See all activities",
                },
              ].map((f, idx, arr) => (
                <div
                  key={f.n}
                  className={`py-9 px-7 ${idx !== arr.length - 1 ? "md:border-r border-b md:border-b-0 border-white/15" : ""}`}
                >
                  <span className="font-display text-gold text-sm block mb-2.5">{f.n}</span>
                  <h3 className="font-display text-xl text-sand">{f.title}</h3>
                  <p className="text-granite-light text-sm mt-2">{f.body}</p>
                  <Link href={f.href} className="text-gold font-semibold text-sm inline-flex items-center gap-1.5 mt-3.5">
                    {f.label} <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Gallery ===== */}
      <section className="py-28">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <FrondDivider />
          <Reveal>
            <SectionHead center eyebrow="A glimpse of paradise" title="Our Gallery" />
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] gap-4">
            {galleryImages.map((src, i) => (
              <Reveal
                key={src}
                delay={(i % 4) * 0.06}
                className={i % 3 === 0 ? "row-span-2" : ""}
              >
                <Boulder
                  src={src}
                  alt="Sibert Residence, La Digue"
                  variant={((i % 3) + 1) as 1 | 2 | 3}
                  aspect="h-full"
                  className="h-full rounded-[20px]"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-28 bg-green-pale">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <span className="font-script text-3xl text-gold-deep block leading-none mb-1">Ready when you are</span>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-green-deep">
              La Digue is waiting — white beaches, granite boulders and quiet Creole villages
            </h2>
            <p className="text-ink-soft mt-4">
              Best explored by bike or on foot, with unforgettable sunsets over Anse Severe. Let us help you plan
              the rest of the stay.
            </p>
            <div className="flex flex-wrap gap-4 mt-7">
              <a href="#booking" className="btn-primary bg-green-deep text-sand hover:bg-green-mid">
                Check Availability
              </a>
              <Link
                href="/services"
                className="inline-flex items-center gap-2.5 border border-green-deep text-green-deep font-medium px-6 py-4 rounded-full text-sm hover:bg-white/60 transition-all"
              >
                View Excursions
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Boulder
              src={exteriorImages.cta}
              alt="La Digue island scenery"
              variant={2}
              aspect="aspect-[4/4.6]"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
