import Image from "next/image";

const RADII = {
  1: "rounded-boulder1",
  2: "rounded-boulder2",
  3: "rounded-boulder3",
} as const;

export default function Boulder({
  src,
  alt,
  variant = 1,
  className = "",
  aspect = "aspect-[4/5]",
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  variant?: 1 | 2 | 3;
  className?: string;
  aspect?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`boulder-media relative overflow-hidden shadow-soft ${RADII[variant]} ${aspect} ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
