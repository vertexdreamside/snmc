import Link from "next/link";
import Image from "next/image";
import type { Room } from "@/lib/content";

export default function RoomCard({ room }: { room: Room }) {
  return (
    <article className="h-full bg-white rounded-[26px] overflow-hidden shadow-soft transition-transform duration-300 hover:-translate-y-2 flex flex-col group">
      <div className="relative aspect-[5/4] overflow-hidden">
        <span className="absolute top-4 left-4 z-[1] bg-green-deep/85 text-gold text-xs tracking-wide uppercase px-3 py-1.5 rounded-full">
          {room.name}
        </span>
        <Image
          src={room.image}
          alt={room.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <div className="p-7 flex-1 flex flex-col">
        <span className="font-script text-2xl text-gold-deep leading-none">{room.name}</span>
        <h3 className="font-display text-xl mt-1 text-green-deep">{room.tagline}</h3>
        <p className="text-ink-soft text-sm flex-1 mt-2">{room.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-green-pale text-green-deep text-xs font-medium px-3 py-1.5 rounded-full">
            {room.bedding}
          </span>
          {room.highlights.slice(0, 2).map((h) => (
            <span key={h} className="bg-green-pale text-green-deep text-xs font-medium px-3 py-1.5 rounded-full">
              {h}
            </span>
          ))}
        </div>
        <Link
          href={`/rooms#${room.slug}`}
          className="mt-4 font-semibold text-green-deep text-sm inline-flex items-center gap-1.5 group/link"
        >
          View room &amp; check dates <span className="transition-transform group-hover/link:translate-x-1">→</span>
        </Link>
      </div>
    </article>
  );
}
