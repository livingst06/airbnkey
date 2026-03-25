import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { Navbar } from "@/app/components/navbar";
import { ApartmentsProvider } from "@/app/components/apartments-context";
import { Toaster } from "@/components/ui/sonner";
import { getApartmentsDb } from "@/lib/apartments-db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Airbnkey",
    template: "%s | Airbnkey",
  },
  description: "Locations d’appartements à Cannes",
  icons: {
    icon: "/favicon.svg",
  },
};

/** Données appartements lues en BDD : pas de snapshot statique figé au build. */
export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialApartments = await getApartmentsDb().catch(() => [])

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <Navbar />
        <ApartmentsProvider initialApartments={initialApartments}>
          {children}
        </ApartmentsProvider>
        <Toaster />
      </body>
    </html>
  );
}
