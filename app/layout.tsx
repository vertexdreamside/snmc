import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNMC — Seychelles Nurses & Midwives Council",
  description: "Council voting, registration, and licence verification platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
