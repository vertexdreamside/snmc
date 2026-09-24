import type { Metadata } from "next";
import { Fraunces, Work_Sans, Yesteryear } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const yesteryear = Yesteryear({
  subsets: ["latin"],
  variable: "--font-yesteryear",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "SNMC — Seychelles Nurses & Midwives Council",
    template: "%s — SNMC",
  },
  description:
    "The Seychelles Nurses & Midwives Council's Council Voting & Registration Platform — Councillor elections, and nurse/midwife registration and verification.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable} ${yesteryear.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
