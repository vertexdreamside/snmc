"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, Facebook, Instagram } from "lucide-react";
import { NAV_LINKS, type SiteInfo } from "@/lib/content";

export default function Header({ site }: { site: SiteInfo }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-5 md:px-11 transition-all duration-300 ${
          solid
            ? "py-3 bg-green-deep/90 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
            : "py-4"
        }`}
      >
        <button
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="w-[52px] h-[52px] rounded-full bg-white/10 border border-white/30 flex flex-col items-center justify-center gap-[5px] hover:[&_span]:bg-gold"
        >
          <span className="block w-5 h-[2px] bg-white rounded" />
          <span className="block w-5 h-[2px] bg-white rounded" />
          <span className="block w-5 h-[2px] bg-white rounded" />
        </button>

        <Link href="/" className="flex items-center gap-3">
          <div className={`relative ${solid ? "h-[42px]" : "h-[52px]"} w-[52px] transition-all`}>
            <Image src={site.logoWhite} alt="Sibert Residence logo" fill sizes="52px" className="object-contain" />
          </div>
          <span className="hidden sm:block font-display text-white text-base leading-none">
            {site.name}
            <small className="block font-body text-[0.62rem] tracking-[0.24em] uppercase text-gold mt-1">
              {site.tagline}
            </small>
          </span>
        </Link>

        <Link
          href="/rooms#booking"
          className="inline-flex items-center gap-2 bg-gold text-green-deep font-semibold text-sm px-5 py-3 rounded-full shadow-[0_10px_24px_-10px_rgba(227,168,87,0.7)] hover:bg-white transition-all hover:-translate-y-0.5"
        >
          Book Your Stay
        </Link>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[190] bg-[#091a13]/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Site menu"
              className="fixed top-0 left-0 bottom-0 z-[205] w-[min(360px,86vw)] bg-gradient-to-b from-green-deep to-[#0A2A20] px-9 pt-28 pb-10 overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.77, 0, 0.18, 1] }}
            >
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute top-6 right-6 w-11 h-11 rounded-full border border-white/25 flex items-center justify-center text-sand hover:text-gold hover:border-gold"
              >
                <X size={18} />
              </button>

              <ul>
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const isExpanded = expanded === link.label;
                  return (
                    <li key={link.label} className="border-b border-white/10">
                      {link.children ? (
                        <>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : link.label)}
                            className={`w-full flex items-center justify-between py-4 font-display text-xl transition-colors ${
                              isActive ? "text-gold" : "text-sand hover:text-gold"
                            }`}
                          >
                            {link.label}
                            <ChevronRight
                              size={18}
                              className={`text-granite-light transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          <div
                            className="overflow-hidden transition-all duration-300"
                            style={{ maxHeight: isExpanded ? 220 : 0 }}
                          >
                            <ul>
                              {link.children.map((child) => (
                                <li key={child.label}>
                                  <Link
                                    href={child.href}
                                    className="flex items-center gap-2 py-2.5 pl-4 text-sm text-granite-light hover:text-gold hover:pl-5 transition-all"
                                  >
                                    <span className="text-gold">—</span>
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <Link
                          href={link.href}
                          className={`block py-4 font-display text-xl transition-colors ${
                            isActive ? "text-gold" : "text-sand hover:text-gold"
                          }`}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-9 pt-6 border-t border-white/10 text-granite-light text-sm space-y-2">
                <a
                  href={site.mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-gold"
                >
                  {site.address}
                </a>
                <a href={site.phoneHref} className="block text-sand hover:text-gold">
                  {site.phone}
                </a>
                {site.whatsappHref && (
                  <a
                    href={site.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sand hover:text-gold"
                  >
                    WhatsApp: {site.whatsapp}
                  </a>
                )}
                <a href={`mailto:${site.email}`} className="block text-sand hover:text-gold break-all">
                  {site.email}
                </a>
                <div className="flex gap-3 pt-3">
                  <a
                    href={site.social.facebook}
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center hover:border-gold hover:text-gold"
                  >
                    <Facebook size={15} />
                  </a>
                  <a
                    href={site.social.instagram}
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center hover:border-gold hover:text-gold"
                  >
                    <Instagram size={15} />
                  </a>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
