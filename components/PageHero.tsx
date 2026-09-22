import Image from "next/image";

export default function PageHero({
  crumb,
  eyebrow,
  title,
  lede,
  image,
}: {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  image: string;
}) {
  return (
    <section className="relative min-h-[50vh] sm:min-h-[56vh] flex items-end pt-[110px] sm:pt-[150px] overflow-hidden">
      <div className="absolute inset-0">
        <Image src={image} alt="" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a231a]/40 via-[#0a231a]/30 to-[#091a13]/92" />
      </div>
      <div className="relative z-[2] max-w-[1180px] mx-auto px-5 sm:px-8 pb-10 sm:pb-16 w-full">
        <span className="block uppercase tracking-wide text-xs text-granite-light mb-3.5">{crumb}</span>
        <span className="font-script text-2xl sm:text-3xl md:text-4xl text-gold block leading-none mb-1">{eyebrow}</span>
        <h1 className="font-display font-medium text-white text-3xl sm:text-4xl md:text-6xl max-w-[14ch]" style={{ textShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
          {title}
        </h1>
        <p className="text-sand/90 max-w-[44ch] mt-4 text-base sm:text-lg">{lede}</p>
      </div>
    </section>
  );
}
