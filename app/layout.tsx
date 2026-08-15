import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";

// Baloo_2 matches the live SNMC website's bold, rounded heading style
// (see "Application for Registration" reference) — previously the app
// referenced 'Fraunces' in Tailwind but never actually loaded it via
// next/font or a stylesheet link, so every heading was silently falling
// back to plain Georgia the whole time. Loading both fonts properly here
// fixes that gap as well as matching the new reference.
const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "SNMC — Seychelles Nurses & Midwives Council",
  description: "Council voting, registration, and licence verification platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
