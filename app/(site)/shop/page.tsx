import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import Boulder from "@/components/Boulder";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import { getShopCategories, getSite } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Souvenir Shop",
  description:
    "Moonlight Craft Curios — the souvenir shop at Sibert Residence, La Digue, Seychelles. Hand-made Creole crafts and island keepsakes.",
};

export default async function ShopPage() {
  const [shopCategories, site] = await Promise.all([getShopCategories(), getSite()]);

  return (
    <>
      <PageHero
        crumb="Home / Souvenir Shop"
        eyebrow="Moonlight Craft Curios"
        title="Souvenir Shop"
        lede="Take a piece of La Digue home — hand-made crafts, island keepsakes and gifts, right on the property."
        image="/images/shop/moonlight-sign.jpg"
      />

      <section className="py-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <Boulder
              src="/images/shop/shop-crafts-2.jpg"
              alt="Moonlight Craft Curios souvenir shop at Sibert Residence"
              aspect="aspect-[4/4.6]"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <span className="font-script text-3xl text-gold-deep block leading-none mb-1">Local &amp; hand-made</span>
            <h2 className="font-display font-semibold text-3xl text-green-deep">
              Discover unique Creole crafts and keepsakes
            </h2>
            <p className="text-ink-soft mt-4">
              Moonlight Craft Curios sits right at Sibert Residence, stocked with hand-made souvenirs and local
              crafts that make for memorable island keepsakes. Woven palm-leaf work, coconut-shell pieces, island
              spices and small Creole artworks — the kind of finds that are hard to come by once you&apos;ve left
              the island.
            </p>
            <p className="text-ink-soft mt-3">
              Open daily to guests and visitors, with new pieces from local makers arriving throughout the season.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-24 bg-green-pale">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHead center eyebrow="What you'll find" title="Shop Categories" />
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {shopCategories.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.08}>
                <article className="bg-white rounded-[26px] overflow-hidden shadow-soft h-full flex flex-col">
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <Image src={c.image} alt={c.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg text-green-deep">{c.name}</h3>
                    <p className="text-ink-soft text-sm mt-2">{c.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-green-deep text-sand text-center">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="font-script text-3xl text-gold block leading-none mb-1">Stop by</span>
            <h2 className="font-display font-semibold text-3xl text-sand">Visit the shop during your stay</h2>
            <p className="max-w-[520px] mx-auto mt-4 mb-7 text-granite-light">
              Moonlight Craft Curios is open daily at the guest house — no need to book, just drop in on your way
              to or from the beach.
            </p>
            <a href={site.mapsHref} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Get Directions
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
