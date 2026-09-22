import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHead from "@/components/SectionHead";
import FaqAccordion from "@/components/FaqAccordion";
import { getExteriorImages, getFaq, getPricing } from "@/lib/cms";
import { Clock, LogIn, LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Check-in and check-out times, restaurant opening hours, deposit and cancellation policies for Sibert Residence, La Digue.",
};

export default async function FaqPage() {
  const [exteriorImages, faq, pricing] = await Promise.all([getExteriorImages(), getFaq(), getPricing()]);

  return (
    <>
      <PageHero
        crumb="Home / FAQ"
        eyebrow="Good to know"
        title="Frequently Asked Questions"
        lede="Check-in times, restaurant hours, and how deposits and cancellations work — everything for planning your stay."
        image={exteriorImages.hero}
      />

      {/* ===== Quick facts ===== */}
      <section className="py-20">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <Reveal>
              <div className="bg-white rounded-2xl shadow-soft p-6 h-full">
                <div className="w-11 h-11 rounded-full bg-green-pale text-green-deep flex items-center justify-center mb-3">
                  <LogIn size={18} />
                </div>
                <h3 className="font-display text-lg text-green-deep">Check-In</h3>
                <p className="text-2xl font-display text-gold-deep mt-1">{faq.checkIn}</p>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="bg-white rounded-2xl shadow-soft p-6 h-full">
                <div className="w-11 h-11 rounded-full bg-green-pale text-green-deep flex items-center justify-center mb-3">
                  <LogOut size={18} />
                </div>
                <h3 className="font-display text-lg text-green-deep">Check-Out</h3>
                <p className="text-2xl font-display text-gold-deep mt-1">{faq.checkOut}</p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="bg-white rounded-2xl shadow-soft p-6 h-full">
                <div className="w-11 h-11 rounded-full bg-green-pale text-green-deep flex items-center justify-center mb-3">
                  <Clock size={18} />
                </div>
                <h3 className="font-display text-lg text-green-deep">Restaurant Hours</h3>
                <ul className="mt-1 space-y-0.5">
                  {faq.restaurantHours.map((h) => (
                    <li key={h.label} className="text-sm text-ink-soft">
                      <strong className="text-ink">{h.label}:</strong> {h.time}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.16}>
            <p className="text-sm text-ink-soft mt-6 bg-sand-deep rounded-xl px-5 py-4">{faq.checkInOutNote}</p>
          </Reveal>
        </div>
      </section>

      {/* ===== Accordion ===== */}
      <section className="py-16 bg-green-pale">
        <div className="max-w-[820px] mx-auto px-6 sm:px-8">
          <Reveal>
            <SectionHead center eyebrow="Questions & answers" title="FAQ" />
          </Reveal>
          <Reveal delay={0.08}>
            <FaqAccordion items={faq.items} />
          </Reveal>
        </div>
      </section>

      {/* ===== Deposit / prepayment policy ===== */}
      <section className="py-20 bg-green-deep text-sand">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <Reveal>
            <span className="font-script text-3xl text-gold block leading-none mb-1">Booking policies</span>
            <h2 className="font-display font-semibold text-3xl text-sand">Deposit &amp; Cancellation</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-10 mt-8">
            <Reveal delay={0.08}>
              <h3 className="font-display text-lg text-gold mb-3">Prepayment Policy</h3>
              <ul className="space-y-2.5 text-sm text-granite-light list-disc pl-4">
                {pricing.prepayment.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.14}>
              <h3 className="font-display text-lg text-gold mb-3">Cancellation Policy</h3>
              <ul className="space-y-2.5 text-sm text-granite-light list-disc pl-4">
                {pricing.cancellation.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.18}>
            <p className="text-xs text-granite-light mt-8">
              Full rate details, seasonal pricing, and offers are on the{" "}
              <a href="/rooms#booking" className="text-gold underline underline-offset-2">
                Rooms page
              </a>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
