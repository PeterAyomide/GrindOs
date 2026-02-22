/**
 * layout.tsx — Root App Layout
 *
 * Loads JetBrains Mono from Google Fonts and applies the global CSS reset.
 * No providers needed here — Zustand is framework-agnostic and doesn't
 * require a context provider.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrindOS — Discipline Protocol",
  description:
    "A brutalist personal discipline dashboard. No comfort. No compromise.",
  // Prevents search engine indexing (this is a personal tool)
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <head>
        {/* JetBrains Mono via Google Fonts — monospace terminal aesthetic */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
