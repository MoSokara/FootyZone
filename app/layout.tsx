import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FootyZone — Football Draft Game",
  description: "A modern football team randomizer powered by API-Football.",
};

/** Provides the shared HTML document shell for application routes. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
