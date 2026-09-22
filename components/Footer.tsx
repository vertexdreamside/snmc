import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";
import { type SiteInfo } from "@/lib/content";

export default function Footer({ site }: { site: SiteInfo }) {
  return (
    <footer className="bg-[#0A2A20] text-granite-light pt-16 pb-8">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-11 mb-12">
          <div>
            <div className="relative h-12 w-32 mb-3">
              <Image src={site.logoWhite} alt="Sibert Residence logo" fill className="object-contain object-left" />
            </div>
            <p className="font-display italic text-sand/90 text-sm mb-2">{site.slogan}</p>
            <p className="text-sm">
              A family-run guest house in La Passe, La Digue — relaxed rooms, Creole dining and island adventures.
            </p>
            <div className="flex gap-2.5 mt-4">
              <a href={site.social.facebook} aria-label="Facebook" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold">
                <Facebook size={15} />
              </a>
              <a href={site.social.instagram} aria-label="Instagram" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold">
                <Instagram size={15} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sand text-sm tracking-wide uppercase mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/rooms" className="hover:text-gold">Rooms</Link></li>
              <li><Link href="/restaurant" className="hover:text-gold">Restaurant &amp; Bar</Link></li>
              <li><Link href="/shop" className="hover:text-gold">Souvenir Shop</Link></li>
              <li><Link href="/services" className="hover:text-gold">Services</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sand text-sm tracking-wide uppercase mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/services#boat" className="hover:text-gold">Boat Excursion</Link></li>
              <li><Link href="/services#buggy" className="hover:text-gold">Buggy Island Tour</Link></li>
              <li><Link href="/services#bike" className="hover:text-gold">Bicycle Rental</Link></li>
              <li><Link href="/faq" className="hover:text-gold">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-gold">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sand text-sm tracking-wide uppercase mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={site.mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold"
                >
                  {site.address}
                </a>
              </li>
              <li><a href={site.phoneHref} className="hover:text-gold">{site.phone}</a></li>
              {site.whatsappHref && (
                <li>
                  <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                    WhatsApp: {site.whatsapp}
                  </a>
                </li>
              )}
              <li><a href={`mailto:${site.email}`} className="hover:text-gold break-all">{site.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-xs text-granite">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <span>Built by Databytes Consultancy Pty Ltd</span>
        </div>
      </div>
    </footer>
  );
}
