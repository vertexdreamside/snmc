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
    default: "Sibert Residence — Guest House on La Digue, Seychelles",
    template: "%s — Sibert Residence",
  },
  description:
    "Sibert Residence is a family-run guest house on La Passe beach, La Digue, Seychelles — five minutes from the jetty, with Creole dining, a cocktail bar, souvenir shop and island excursions.",
  icons: {
    icon: "/images/logo/sibert-logo-green.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable} ${yesteryear.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
