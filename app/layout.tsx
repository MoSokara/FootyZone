import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FootyZone — Football Draft Game",
  description: "A modern football team randomizer powered by API-Football.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
