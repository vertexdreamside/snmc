import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import Boulder from "@/components/Boulder";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { BookingPanel } from "@/components/BookingForm";
import { getExteriorImages, getPricing, getRooms, getAvailability, getSite } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Explore the Superior and Deluxe rooms at Sibert Residence, a guest house on La Digue, Seychelles.",
};

export default async function RoomsPage() {
  const [exteriorImages, pricing, rooms, availability, site] = await Promise.all([
    getExteriorImages(),
    getPricing(),
    getRooms(),
    getAvailability(),
    getSite(),
  ]);

  return (
    <>
      <PageHero
        crumb="Home / Rooms"
        eyebrow="Where you'll sleep"
        title="Our Rooms"
        lede="Two room types, each turned toward the garden or the sea — pick the one that fits how you like to travel."
        image={exteriorImages.hero}
      />

      <section className="py-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          {rooms.map((room, i) => (
            <article
              key={room.slug}
              id={room.slug}
              className={`grid md:grid-cols-2 gap-14 items-center py-16 ${
                i !== rooms.length - 1 ? "border-b border-granite-light" : ""
              }`}
            >
              <Reveal className={i % 2 === 1 ? "md:order-2" : ""}>
                <Boulder src={room.image} alt={room.name} variant={i === 0 ? 1 : 2} aspect="aspect-[6/5]" />
              </Reveal>
              <Reveal delay={0.1}>
                <span className="font-script text-3xl text-gold-deep block leading-none mb-1">{room.name}</span>
                <h2 className="font-display font-semibold text-3xl text-green-deep">{room.tagline}</h2>
                <p className="text-ink-soft mt-4">{room.description}</p>
                <p className="text-sm text-ink-soft mt-4">
                  <strong className="text-ink">Bedding:</strong> {room.bedding} &nbsp;·&nbsp;{" "}
                  <strong className="text-ink">Occupancy:</strong> {room.occupancy}
                </p>
                <ul className="flex flex-wrap gap-2.5 mt-4 mb-6">
                  {room.highlights.map((h) => (
                    <li key={h} className="bg-sand-deep text-green-deep text-sm px-3.5 py-2 rounded-full">
                      {h}
                    </li>
                  ))}
                </ul>
                <a href="#booking" className="btn-primary bg-green-deep text-sand">
                  See Rates &amp; Book
                </a>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="py-24 bg-green-pale">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHead center eyebrow="Every stay includes" title="Comfort, taken care of" />
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["Daily Housekeeping", "Fresh linen, towels and daily room service throughout your stay."],
              ["Continental Breakfast", "Fruit, juice and local favourites to start the day right."],
              ["Free Wi-Fi & Security", "Free Wi-Fi throughout the property, with full-day security and luggage storage."],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="bg-white rounded-[26px] shadow-soft p-7 h-full">
                  <h3 className="font-display text-xl text-green-deep">{title}</h3>
                  <p className="text-ink-soft text-sm mt-2">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-green-deep text-sand">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="font-script text-3xl text-gold block leading-none mb-1">When to visit</span>
            <h2 className="font-display font-semibold text-3xl text-sand">Season Dates</h2>
            <p className="text-granite-light mt-3 max-w-2xl">
              Rates vary by season and are shown automatically once you select your dates below — along with any
              offers and the full terms &amp; conditions for that stay.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              {pricing.seasons.map((s) => (
                <div key={s.name} className="rounded-2xl border border-white/15 p-6">
                  <h3 className="font-display text-lg text-gold">{s.name}</h3>
                  <p className="text-granite-light text-sm mt-2">{s.dates}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHead
              center
              eyebrow="Check availability"
              title="Book Your Stay"
              description="Select your dates and room below to see the rate and any offers for your stay, then send us an availability request — we'll confirm by email before anything is final."
            />
          </Reveal>
          <Suspense fallback={null}>
            <Reveal delay={0.1}>
              <BookingPanel rooms={rooms} availability={availability} pricing={pricing} site={site} />
            </Reveal>
          </Suspense>
        </div>
      </section>
    </>
  );
}
