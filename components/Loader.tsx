"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { SiteInfo } from "@/lib/content";

export default function Loader({ site }: { site: SiteInfo }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setHidden(true);
      document.body.style.overflow = "";
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-green-deep overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          {/* Decorative gold botanical line art, echoing the brand signature */}
          <svg
            viewBox="0 0 400 400"
            className="absolute -right-16 -top-16 w-[280px] h-[280px] md:w-[380px] md:h-[380px] text-gold/20 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M340 40C300 90 260 130 210 160" />
            <path d="M330 30c-40 10-90 55-140 130-30 45-45 90-50 140" strokeWidth="1.4" />
            <path d="M180 180c-30-40-30-90 10-140M180 180c10-50 45-85 95-100M180 180c-45 5-85-15-110-55M180 180c-50-10-90 10-120 55M180 180c-5 50 20 95 65 120M180 180c45 15 95 5 130-30M180 180c50 5 90-20 115-65" />
          </svg>
          <svg
            viewBox="0 0 300 300"
            className="absolute -left-20 -bottom-20 w-[220px] h-[220px] md:w-[300px] md:h-[300px] text-gold/15 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M20 280c60-70 110-120 150-190" />
            <path d="M170 90c-40 10-90 40-130 60M170 90c-45-5-95 5-140 35M170 90c-30-30-75-45-125-40M170 90c-20-40-60-65-110-70M170 90c10-45 45-80 95-95" />
          </svg>

          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-[0.68rem] tracking-[0.35em] uppercase text-gold/90 mb-2"
          >
            {site.sloganEyebrow}
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.1, ease: "easeOut" }}
            className="relative w-[100px] h-[100px]"
          >
            <Image src={site.logoMark} alt="" fill sizes="100px" className="object-contain" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.25, ease: "easeOut" }}
            className="font-script text-2xl text-sand mt-3"
          >
            {site.name}
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
            className="font-display italic text-sand/85 text-sm mt-1.5"
          >
            {site.slogan}
          </motion.span>

          <div className="mt-6 w-32 h-[2px] rounded bg-gold/20 relative overflow-hidden">
            <motion.span
              className="absolute inset-y-0 w-2/5 bg-gold rounded"
              animate={{ left: ["-40%", "100%"] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
