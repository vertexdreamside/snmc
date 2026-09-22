import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Boulder from "@/components/Boulder";
import Reveal from "@/components/Reveal";
import { getServices, getSite } from "@/lib/cms";
import { whatsAppLink } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Boat excursions, buggy island tours and bicycle rentals at Sibert Residence, La Digue, Seychelles.",
};

export default async function ServicesPage() {
  const [services, site] = await Promise.all([getServices(), getSite()]);

  return (
    <>
      <PageHero
        crumb="Home / Services"
        eyebrow="Get out and explore"
        title="Island Services & Excursions"
        lede="Sail the coastline, tour the island by buggy, or pedal to the beaches at your own pace — arranged for you right at the guest house."
        image={services[0]?.image ?? "https://sibert.sc/wp-content/uploads/2025/10/IMG-20250911-WA0023-scaled.jpg"}
      />

      <section className="py-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          {services.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              className={`grid md:grid-cols-2 gap-14 items-center py-16 ${
                i !== services.length - 1 ? "border-b border-granite-light" : ""
              }`}
            >
              <Reveal className={i % 2 === 1 ? "md:order-2" : ""}>
                <Boulder src={s.image} alt={s.name} variant={((i % 3) + 1) as 1 | 2 | 3} aspect="aspect-[6/5]" />
              </Reveal>
              <Reveal delay={0.1}>
                <span className="font-script text-3xl text-gold-deep block leading-none mb-1">{s.name}</span>
                <h2 className="font-display font-semibold text-3xl text-green-deep">{s.tagline}</h2>
                <p className="text-ink-soft mt-4">{s.description}</p>
                <ul className="flex flex-wrap gap-2.5 mt-4 mb-6">
                  {s.highlights.map((h) => (
                    <li key={h} className="bg-sand-deep text-green-deep text-sm px-3.5 py-2 rounded-full">
                      {h}
                    </li>
                  ))}
                </ul>
                <a
                  href={whatsAppLink(site, `Hello, I would like to enquire about the ${s.name} at Sibert Residence.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary bg-green-deep text-sand"
                >
                  Enquire About This Trip
                </a>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="py-24 bg-green-deep text-sand text-center">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="font-script text-3xl text-gold block leading-none mb-1">Not sure where to start?</span>
            <h2 className="font-display font-semibold text-3xl text-sand">
              Let us help you plan your days on La Digue
            </h2>
            <p className="max-w-[520px] mx-auto mt-4 mb-7 text-granite-light">
              Tell us how many days you have and what you&apos;d like to see, and we&apos;ll put together a mix of
              excursions that fits your stay.
            </p>
            <a
              href={whatsAppLink(site, "Hello, I would like some assistance planning my stay at Sibert Residence.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open WhatsApp
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
