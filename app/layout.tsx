import type { Metadata } from "next";
import "./globals.css";

// Fonts loaded via a plain <link> tag in the <head> below, not
// next/font/google. next/font fetches font files at BUILD time on
// Vercel's own servers — a build log showed fonts.gstatic.com requests
// failing there, which would make the whole deploy depend on Google's
// CDN being reachable from Vercel's build machine at that exact moment.
// A runtime <link> tag instead loads fonts in the visitor's own browser,
// same as a plain HTML site — slightly less optimized than next/font,
// but it can never fail the build.
export const metadata: Metadata = {
  title: "SNMC — Seychelles Nurses & Midwives Council",
  description: "Council voting, registration, and licence verification platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
